# Odoo Security Rules

- No wildcard ACL widening without explicit rationale.
- No `SUPERUSER_ID` bypass without justification and tests.
- Record rules must be explicit and reviewable.
- New secrets access must be documented and policy-approved.
- Outbound HTTP destinations must be allowlisted.
