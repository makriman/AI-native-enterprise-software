# Upstream Upgrade Runbook

1. Run `infra/scripts/pin-upstream-odoo.sh` during approved rebase window.
2. Commit `upstream/odoo-community.lock` update.
3. Execute compatibility pipeline:
   - install tests
   - upgrade tests
   - policy checks
4. Fix overlay modules only; avoid direct upstream edits.
5. Release new stable patch lane.
