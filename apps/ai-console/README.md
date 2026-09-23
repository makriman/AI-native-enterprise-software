# ai-console

Business-facing console for governed Odoo implementation delivery.

## Surfaces
- Dashboard
- Build Composer / History / Detail
- Diff, Logs, Test Results, Sandbox Preview
- Deployments and Rollback
- Connections and Auth Modes
- Policy Findings, Drift, Audit, RBAC

## Auth

`CONTROL_API_TOKEN` is attached by server-side fetches and by `/console/control/*`. The browser does not receive it.

`POST /api/session` mints an `operator` session only when `Authorization: Bearer $CONSOLE_OPERATOR_TOKEN` matches. The role in the JSON body is ignored. The `oae_session` cookie is HMAC-signed with `CONSOLE_SESSION_SECRET`. Set `CONSOLE_COOKIE_SECURE=true` on HTTPS.

## Run
```bash
pnpm --filter @oae/ai-console dev
```
