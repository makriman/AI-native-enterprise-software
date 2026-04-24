# runner-supervisor

Coordinates build run execution contexts for managed and edge modes.

Current skeleton features:
- run dispatch API
- per-run workspace allocation
- lifecycle status tracking
- cancellation endpoint

Future integration points:
- managed Codex SDK worker pool
- edge agent dispatch broker
- resource and egress enforcement
- artifact collection channels
