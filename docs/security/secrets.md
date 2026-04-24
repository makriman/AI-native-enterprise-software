# Secret Handling

Development:
- `.env` for local compose only

Production:
- Docker/Kubernetes secrets or Vault
- short-lived per-job secrets for managed runners
- no secret values in logs or artifacts

Edge mode:
- ChatGPT-linked credentials remain local on agent host
