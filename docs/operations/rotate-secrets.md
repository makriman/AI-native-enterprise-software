# Secret Rotation Runbook

1. Enable deployment freeze mode.
2. Generate a new value for each secret you are rotating:

   ```bash
   openssl rand -hex 32
   ```

   Rotate these independently. Do not reuse one value across services.

   - `CONTROL_API_TOKEN` (control-api and ai-console must match)
   - `EDGE_AGENT_TOKEN` on the control API and `AGENT_TOKEN` on each edge agent (these must match)
   - `LOG_GATEWAY_TOKEN`
   - `RUNNER_SUPERVISOR_TOKEN`
   - `CONSOLE_SESSION_SECRET` (invalidates every existing console cookie)
   - `CONSOLE_OPERATOR_TOKEN` (required to mint a new console session)
   - OpenAI API credentials in workspace connection settings
   - Odoo bridge API token (`oae_ai_bridge.api_token`)

3. Update the secret store or untracked env file. Do not commit the new values. The tracked examples stay placeholders.
4. Restart control-api, log-gateway, runner-supervisor, ai-console, and the edge agents so each process loads the new secret.
5. Re-register edge agents. They send `Authorization: Bearer $AGENT_TOKEN` and the same token in the registration body. Registration fails if the body token does not match `EDGE_AGENT_TOKEN`.
6. Mint a new console session. Previous cookies fail HMAC verification after `CONSOLE_SESSION_SECRET` changes:

   ```bash
   curl -i -c cookies.txt -X POST "$CONSOLE_ORIGIN/api/session" \
     -H "Authorization: Bearer $CONSOLE_OPERATOR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"user_id":"operator"}'
   ```

   The response role is `operator` even if the JSON includes a different `role`.
7. Check the gates:
   - `GET /health` on control-api, log-gateway, and runner-supervisor succeeds without a bearer token.
   - `POST /api/v1/builds/{id}/approve`, `POST /api/v1/builds/{id}/deploy`, and `POST /api/v1/deployments/{id}/rollback` without `Authorization: Bearer $CONTROL_API_TOKEN` return 401, or 503 if that token is unset.
   - `POST /api/session` without `Authorization: Bearer $CONSOLE_OPERATOR_TOKEN` returns 401, or 503 if the operator token or session secret is unset.
8. Disable freeze mode after validation.

Behind the compose proxy, `POST /api/session` is forwarded to the console. Other `/api/` paths stay on the control API.
