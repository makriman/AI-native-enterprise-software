from datetime import datetime, timezone

from odoo import api, models


class OaeBridgeService(models.AbstractModel):
    _name = "oae.ai.bridge.service"
    _description = "OAE AI Bridge Service"

    @api.model
    def _external_ids_for(self, records):
        if not records:
            return {}

        data = self.env["ir.model.data"].sudo().search(
            [("model", "=", records._name), ("res_id", "in", records.ids)]
        )
        result = {}
        for rec in data:
            result[rec.res_id] = f"{rec.module}.{rec.name}"
        return result

    @api.model
    def _snapshot_modules(self):
        modules = self.env["ir.module.module"].sudo().search([("state", "=", "installed")])
        return [
            {
                "name": module.name,
                "state": module.state,
                "latest_version": module.latest_version,
                "category": module.category_id.name if module.category_id else None,
            }
            for module in modules
        ]

    @api.model
    def _snapshot_fields(self):
        fields = self.env["ir.model.fields"].sudo().search([], limit=5000)
        return [
            {
                "model": field.model,
                "name": field.name,
                "ttype": field.ttype,
                "relation": field.relation,
                "required": field.required,
                "readonly": field.readonly,
            }
            for field in fields
        ]

    @api.model
    def _snapshot_views(self):
        views = self.env["ir.ui.view"].sudo().search([], limit=3000)
        external_ids = self._external_ids_for(views)

        return [
            {
                "xml_id": external_ids.get(view.id),
                "model": view.model,
                "type": view.type,
                "arch_hash": str(hash(view.arch_db or "")),
            }
            for view in views
            if external_ids.get(view.id)
        ]

    @api.model
    def _snapshot_acls(self):
        acls = self.env["ir.model.access"].sudo().search([])
        model_external_ids = self._external_ids_for(acls.mapped("model_id"))
        group_external_ids = self._external_ids_for(acls.mapped("group_id"))

        return [
            {
                "model": model_external_ids.get(acl.model_id.id, acl.model_id.model),
                "group_xml_id": group_external_ids.get(acl.group_id.id),
                "read": acl.perm_read,
                "write": acl.perm_write,
                "create": acl.perm_create,
                "unlink": acl.perm_unlink,
            }
            for acl in acls
        ]

    @api.model
    def _snapshot_record_rules(self):
        rules = self.env["ir.rule"].sudo().search([])
        model_external_ids = self._external_ids_for(rules.mapped("model_id"))
        group_external_ids = self._external_ids_for(rules.mapped("groups"))

        return [
            {
                "name": rule.name,
                "model": model_external_ids.get(rule.model_id.id, rule.model_id.model),
                "domain_force": rule.domain_force,
                "groups": [group_external_ids.get(group.id) for group in rule.groups if group_external_ids.get(group.id)],
            }
            for rule in rules
        ]

    @api.model
    def _snapshot_crons(self):
        jobs = self.env["ir.cron"].sudo().search([])
        xml_ids = self._external_ids_for(jobs)

        return [
            {
                "xml_id": xml_ids.get(job.id),
                "model": job.model_id.model,
                "method": job.code,
                "interval_number": job.interval_number,
                "interval_type": job.interval_type,
                "active": job.active,
            }
            for job in jobs
            if xml_ids.get(job.id)
        ]

    @api.model
    def _snapshot_reports(self):
        reports = self.env["ir.actions.report"].sudo().search([])
        xml_ids = self._external_ids_for(reports)

        return [
            {
                "xml_id": xml_ids.get(report.id),
                "model": report.model,
                "report_type": report.report_type,
                "report_name": report.report_name,
            }
            for report in reports
            if xml_ids.get(report.id)
        ]

    @api.model
    def _snapshot_menus(self):
        menus = self.env["ir.ui.menu"].sudo().search([])
        xml_ids = self._external_ids_for(menus)

        return [
            {
                "xml_id": xml_ids.get(menu.id),
                "name": menu.name,
                "parent_xml_id": xml_ids.get(menu.parent_id.id) if menu.parent_id else None,
                "action": menu.action.id if menu.action else None,
            }
            for menu in menus
            if xml_ids.get(menu.id)
        ]

    @api.model
    def _snapshot_actions(self):
        actions = self.env["ir.actions.actions"].sudo().search([])
        xml_ids = self._external_ids_for(actions)

        return [
            {
                "xml_id": xml_ids.get(action.id),
                "name": action.name,
                "type": action.type,
                "binding_model_id": action.binding_model_id.model if action.binding_model_id else None,
            }
            for action in actions
            if xml_ids.get(action.id)
        ]

    @api.model
    def _snapshot_mail_templates(self):
        templates = self.env["mail.template"].sudo().search([])
        xml_ids = self._external_ids_for(templates)

        return [
            {
                "xml_id": xml_ids.get(template.id),
                "name": template.name,
                "model": template.model,
                "subject": template.subject,
            }
            for template in templates
            if xml_ids.get(template.id)
        ]

    @api.model
    def _settings_manifest(self):
        keys = [
            "web.base.url",
            "database.uuid",
            "auth_signup.allow_uninvited",
            "oae_ai_bridge.console_url",
        ]
        params = self.env["ir.config_parameter"].sudo()
        return {key: params.get_param(key) for key in keys if params.get_param(key)}

    @api.model
    def export_snapshot_bundle(self):
        version = self.env["ir.module.module"].sudo().search([("name", "=", "base")], limit=1).latest_version
        return {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "odoo_version": version or "19.x",
            "modules": self._snapshot_modules(),
            "fields": self._snapshot_fields(),
            "views": self._snapshot_views(),
            "menus": self._snapshot_menus(),
            "actions": self._snapshot_actions(),
            "acls": self._snapshot_acls(),
            "rules": self._snapshot_record_rules(),
            "crons": self._snapshot_crons(),
            "reports": self._snapshot_reports(),
            "mail_templates": self._snapshot_mail_templates(),
            "settings_manifest": self._settings_manifest(),
        }

    @api.model
    def create_context_link(self, model_name, res_id, build_request_id=None):
        base_url = self.env["ir.config_parameter"].sudo().get_param("oae_ai_bridge.console_url", "http://localhost:3000")
        build_path = f"/builds/{build_request_id}" if build_request_id else "/build-composer"

        link = self.env["oae.ai.bridge.context.link"].sudo().create(
            {
                "name": f"{model_name}:{res_id}",
                "model_name": model_name,
                "res_id": res_id,
                "build_request_id": build_request_id,
                "ai_console_url": f"{base_url}{build_path}",
            }
        )
        return {
            "id": link.id,
            "url": link.ai_console_url,
        }
