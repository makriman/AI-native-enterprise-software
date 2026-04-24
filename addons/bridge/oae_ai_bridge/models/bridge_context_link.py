from odoo import fields, models


class OaeBridgeContextLink(models.Model):
    _name = "oae.ai.bridge.context.link"
    _description = "AI Bridge Context Link"
    _order = "create_date desc"

    name = fields.Char(required=True)
    model_name = fields.Char(required=True)
    res_id = fields.Integer(required=True)
    build_request_id = fields.Char(help="Control-plane build request identifier")
    ai_console_url = fields.Char(required=True)
    requested_by_id = fields.Many2one("res.users", default=lambda self: self.env.user, required=True)
    notes = fields.Text()
