# Threat Model

## Primary Risks

- legal contamination from Enterprise code
- unauthorized production changes
- runner secret leakage
- permissive ACL or record rule regressions
- unreviewed destructive migrations

## Controls

- community-only upstream baseline pin
- isolated runner environments
- policy engine + mandatory approvals
- immutable audit trail
- deployment backup and rollback gates
- fail-closed bearer auth on control-api, log-gateway, and runner-supervisor
- HMAC-signed console session cookies; operator role is assigned by the server
