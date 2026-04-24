# Architecture Overview

Odoo AI Edition is built as an overlay distribution over pinned Odoo Community.

## Core Components

- `apps/ai-console`: business-facing governed build UI
- `apps/control-api`: authoritative API for builds, approvals, deployment orchestration
- `apps/runner-supervisor`: execution isolation and run lifecycle management
- `apps/edge-agent`: user-hosted agent for ChatGPT-linked execution mode
- `apps/log-gateway`: stream and replay build timeline events
- `addons/bridge/oae_ai_bridge`: Odoo-side integration and snapshot export
- `packages/spec-schema`: canonical customization schema
- `packages/spec-compiler`: deterministic module/doc scaffold compiler
- `packages/policy-engine`: policy classification and escalation checks
- `packages/odoo-adapter`: snapshot and drift primitives

## Baseline Rule

`upstream/odoo-community` is external baseline and should remain unmodified except approved elevated patches.
