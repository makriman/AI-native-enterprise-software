# Backup and Restore Runbook

Before production promotion:
- capture database snapshot reference
- capture Odoo filestore snapshot reference
- capture deployed artifact/image reference
- persist references in deployment record

Rollback actions must include code rollback and either DB/filestore restore or compensating migration.
