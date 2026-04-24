# Odoo Module Standards

Module naming: `oae_<domain>_<feature>`

Required structure for non-trivial modules:
- `__init__.py`
- `__manifest__.py`
- `README.md`
- `models/`
- `views/`
- `security/`
- `data/`
- `tests/`
- `migrations/`

Security-sensitive modules must include:
- `security/ir.model.access.csv`
- explicit groups/rules where relevant
- ACL tests (positive and negative)
