from odoo import http
from odoo.http import request


class OaeBridgeApiController(http.Controller):
    def _validate_token(self):
        expected = request.env["ir.config_parameter"].sudo().get_param("oae_ai_bridge.api_token")
        if not expected:
            return False

        auth_header = request.httprequest.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return False

        incoming = auth_header.replace("Bearer ", "", 1).strip()
        return incoming == expected

    @http.route("/api/oae/snapshot", type="json", auth="user", methods=["POST"], csrf=False)
    def oae_snapshot(self):
        if not self._validate_token():
            return {"error": "invalid_token"}

        snapshot = request.env["oae.ai.bridge.service"].sudo().export_snapshot_bundle()
        return snapshot

    @http.route("/api/oae/context-link", type="json", auth="user", methods=["POST"], csrf=False)
    def oae_context_link(self, model_name=None, res_id=None, build_request_id=None):
        if not self._validate_token():
            return {"error": "invalid_token"}

        if not model_name or not res_id:
            return {"error": "model_name and res_id are required"}

        link = request.env["oae.ai.bridge.service"].sudo().create_context_link(
            model_name=model_name,
            res_id=int(res_id),
            build_request_id=build_request_id,
        )
        return link

    @http.route("/oae/console", type="http", auth="user", methods=["GET"])
    def oae_console_redirect(self, **kwargs):
        base_url = request.env["ir.config_parameter"].sudo().get_param("oae_ai_bridge.console_url", "http://localhost:3000")
        return request.redirect(base_url)
