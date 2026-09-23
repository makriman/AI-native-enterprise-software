# control-api

Authoritative backend for Odoo AI Edition.

## Responsibilities
- build intake and lifecycle
- plan/spec orchestration
- policy findings
- approvals and deployments
- connection registration
- drift scans
- event streaming

## Run
```bash
pnpm --filter @oae/control-api dev
```

Default port: `4000`

## Auth

Set `CONTROL_API_TOKEN`. Every route except `GET /health` requires `Authorization: Bearer`. Approve, reject, request-changes, deploy, and rollback ignore a caller-supplied `actor` and record `authenticated-operator`.

Set `EDGE_AGENT_TOKEN` for edge registration, heartbeat, and job claim/complete. Registration also compares the JSON `token` field with that secret. If either secret is unset, those routes return 503.
