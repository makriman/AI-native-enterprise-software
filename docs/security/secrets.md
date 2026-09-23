# Secret Handling

Development and production secrets stay outside git. `infra/compose/.env.example` and `infra/compose/.env.server.example` only contain placeholders. Replace every `replace-with-random-token` value with a distinct secret before starting the stack. Generate one with `openssl rand -hex 32`.

The services fail closed. If a required secret is missing or blank, privileged routes return HTTP 503 and do not fall back to a built-in token.

## Required environment variables

| Variable | Process | Purpose |
| --- | --- | --- |
| `CONTROL_API_TOKEN` | control-api, ai-console | Bearer token for control API routes other than `GET /health`. The console server attaches it. Do not expose it as `NEXT_PUBLIC_*`. |
| `EDGE_AGENT_TOKEN` | control-api | Expected edge-agent secret. Registration compares the body `token` with this value. Heartbeat, job claim, and job completion require `Authorization: Bearer`. |
| `AGENT_TOKEN` | edge-agent | Same secret as `EDGE_AGENT_TOKEN`. The process exits if this is unset. There is no `dev-edge-token` fallback. |
| `LOG_GATEWAY_TOKEN` | log-gateway | Bearer token for ingest, replay, and websocket upgrade. `GET /health` stays open. |
| `RUNNER_SUPERVISOR_TOKEN` | runner-supervisor | Bearer token for dispatch, read, and cancel. `GET /health` stays open. |
| `CONSOLE_SESSION_SECRET` | ai-console | HMAC key for the `oae_session` cookie. The cookie is `httpOnly` and `sameSite=lax`. |
| `CONSOLE_OPERATOR_TOKEN` | ai-console | Bearer token required to mint a session. `POST /api/session` assigns role `operator` on the server. A caller-supplied `role` is ignored. |
| `CONSOLE_COOKIE_SECURE` | ai-console | Set to `true` when the console is served over HTTPS so the session cookie is marked `Secure`. Leave `false` for local HTTP. |

Browser actions call `/console/control/...` on the console. That route checks the signed operator cookie, strips any caller-supplied `actor`, and forwards the request with `CONTROL_API_TOKEN`. Approve, deploy, and rollback record the actor as `authenticated-operator`.

## Production

- Docker/Kubernetes secrets or Vault
- short-lived per-job secrets for managed runners
- no secret values in logs or artifacts

Edge mode:

- ChatGPT-linked credentials remain local on the agent host

Rotation steps are in `docs/operations/rotate-secrets.md`.
