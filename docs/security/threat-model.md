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
