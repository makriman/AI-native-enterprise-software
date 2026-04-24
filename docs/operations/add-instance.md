# Add Odoo Instance Runbook

1. Register Odoo connection using `POST /api/v1/connections/odoo-instance`.
2. Create instance metadata in control API (`workspace_id`, `name`, `odoo_url`, `odoo_version`).
3. Configure environments (`dev/sandbox/staging/production`) and branch mapping.
4. Install `oae_ai_bridge` on the target Odoo instance.
5. Set bridge parameters:
   - `oae_ai_bridge.console_url`
   - `oae_ai_bridge.api_token`
6. Trigger initial drift baseline scan.
