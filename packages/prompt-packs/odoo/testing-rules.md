# Odoo Testing Rules

Minimum expected coverage by change type:
- Declarative changes: install, upgrade, ACL, workflow tests.
- Python logic: add unit + integration + ACL tests.
- Controller or portal changes: controller tests and UI smoke tests.
- Elevated changes: full matrix + rollback rehearsal.
