# Diagnose Stuck Builds Runbook

1. Check build status and recent events (`GET /api/v1/builds/{build_id}`).
2. Check runner-supervisor run state (`GET /api/v1/runs/{run_id}`).
3. Verify edge-agent heartbeat (for `chatgpt_edge` mode).
4. Confirm Redis and control-plane DB health.
5. Use kill switch or cancel endpoint for runaway jobs.
6. Requeue build after root-cause remediation.
