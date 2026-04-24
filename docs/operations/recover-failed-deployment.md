# Recover Failed Deployment Runbook

1. Inspect deployment logs and policy findings.
2. Validate backup references (DB + filestore).
3. Execute rollback via `POST /api/v1/deployments/{deployment_id}/rollback`.
4. Run smoke tests on restored environment.
5. Create incident event and link remediation build request.
