# OAE Build Output Contract

Each successful build must emit:

1. `build-manifest.json`
2. `risk-report.json`
3. `affected-entities.json`
4. `diff-summary.md`
5. `functional-summary.md`
6. `technical-summary.md`
7. `uat-checklist.md`
8. `rollback-plan.md`
9. machine-readable test reports

## Additional requirements
- Include migration notes for schema-affecting changes.
- Include ACL positive/negative tests where access is modified.
- Include installation and upgrade validation output.
