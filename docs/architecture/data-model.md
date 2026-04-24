# Control Plane Data Model

Baseline SQL schema lives in:
- `apps/control-api/sql/001_init.sql`

Primary groups:
- identity/workspaces (`users`, `workspaces`, `workspace_memberships`, `roles`, `permissions`)
- instance/env/runner (`instances`, `environments`, `runner_agents`, `connections`)
- build pipeline (`build_requests`, `build_plans`, `customization_specs`, `build_runs`, `build_events`, `artifacts`, `policy_findings`, `test_runs`, `sandbox_previews`)
- deployment pipeline (`deployment_requests`, `deployments`, `rollback_records`, `snapshot_records`, `release_channels`)
- governance (`approvals`, `audit_events`, `usage_ledgers`, `retention_policies`, `incident_events`)
