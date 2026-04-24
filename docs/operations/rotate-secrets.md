# Secret Rotation Runbook

1. Enable deployment freeze mode.
2. Rotate OpenAI API credentials in workspace connection settings.
3. Rotate edge-agent tokens and re-register agents.
4. Rotate Odoo bridge API token (`oae_ai_bridge.api_token`).
5. Restart affected services and verify health endpoints.
6. Disable freeze mode after validation.
