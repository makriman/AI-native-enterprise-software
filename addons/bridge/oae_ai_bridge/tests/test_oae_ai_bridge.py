from odoo.tests import tagged
from odoo.tests.common import TransactionCase


@tagged("post_install", "-at_install")
class TestOaeAiBridge(TransactionCase):
    def test_context_link_creation(self):
        service = self.env["oae.ai.bridge.service"]
        partner = self.env["res.partner"].create({"name": "Bridge Test Partner"})

        result = service.create_context_link(model_name=partner._name, res_id=partner.id)

        self.assertTrue(result.get("url"))
        record = self.env["oae.ai.bridge.context.link"].search([("res_id", "=", partner.id)], limit=1)
        self.assertTrue(record)

    def test_snapshot_contains_modules(self):
        service = self.env["oae.ai.bridge.service"]
        snapshot = service.export_snapshot_bundle()

        self.assertIn("modules", snapshot)
        self.assertIn("settings_manifest", snapshot)
