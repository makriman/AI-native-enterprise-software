# Contributing

## Contribution Requirements

- Sign off commits (DCO) or comply with project CLA requirements.
- Use feature branches and open pull requests.
- Include tests for behavior and security changes.
- Update docs and changelog for material changes.

## Coding Guardrails

- Do not modify `upstream/` unless explicitly approved as elevated core patch work.
- Keep customizations in overlay modules (`addons/generated`, `addons/custom`).
- Never add secrets to git.
- Never silently widen permissions.

## PR Checklist

- [ ] Scope clearly described
- [ ] Tests added/updated
- [ ] Security impact reviewed
- [ ] Migration notes included (if schema/data affected)
- [ ] Rollback notes included
- [ ] Docs updated
