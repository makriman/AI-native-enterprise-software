{
    "name": "OAE AI Bridge",
    "summary": "Bridge between Odoo Community and Odoo AI Edition control plane",
    "version": "19.0.1.0.0",
    "category": "Tools",
    "author": "Odoo AI Edition",
    "license": "LGPL-3",
    "depends": ["base", "web", "mail"],
    "data": [
        "security/oae_ai_bridge_security.xml",
        "security/ir.model.access.csv",
        "views/oae_ai_bridge_views.xml",
        "views/oae_ai_bridge_menu.xml",
        "data/oae_ai_bridge_actions.xml"
    ],
    "installable": True,
    "application": False,
}
