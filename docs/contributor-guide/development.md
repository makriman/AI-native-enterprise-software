# Development Guide

## Prerequisites
- Node.js 22+
- pnpm
- Docker / Docker Compose
- Git

## Local Workflow
1. `pnpm install`
2. `pnpm dev` for monorepo service dev loops
3. `pnpm typecheck && pnpm build && pnpm test` before PR

## Odoo Module Workflow
- keep custom logic in overlay add-ons
- include manifest, security, tests, docs, migration notes
- avoid `upstream/` edits unless elevated process is approved
