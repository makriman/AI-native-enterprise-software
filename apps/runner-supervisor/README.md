# runner-supervisor

Coordinates build run execution contexts for managed and edge modes.

Current skeleton features:
- run dispatch API
- per-run workspace allocation
- lifecycle status tracking
- cancellation endpoint

`GET /health` is public. Dispatch, read, and cancel require `Authorization: Bearer $RUNNER_SUPERVISOR_TOKEN`. The process fails closed with HTTP 503 when that variable is unset.

Future integration points:
- managed Codex SDK worker pool
- edge agent dispatch broker
- resource and egress enforcement
- artifact collection channels
