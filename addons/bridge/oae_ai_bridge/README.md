# oae_ai_bridge

## Purpose
Provides Odoo-side integration hooks for Odoo AI Edition control plane.

## Features
- menu entry to open AI Console
- context action links for current records
- structured snapshot export endpoint
- module inventory and security metadata extraction
- drift support primitives

## Configuration
1. Set system parameter `oae_ai_bridge.console_url` (default `http://localhost:3000`).
2. Set system parameter `oae_ai_bridge.api_token` for bridge API authentication.
3. Grant users `group_oae_ai_bridge_user` to access bridge actions.

## Permissions model
- bridge users: read and create context links
- bridge admins: manage all bridge records and snapshot access

## Operational notes
- Snapshot endpoint is read-only and intended for sandbox/staging/production metadata collection.
- All bridge usage should be audited by the control plane.

## Tests
- model snapshot serialization test
- context link creation test
