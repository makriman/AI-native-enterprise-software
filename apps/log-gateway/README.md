# log-gateway

Streams and replays build/deployment timeline events.

Current skeleton:
- ingest endpoint for structured log frames
- replay endpoint by stream id
- websocket endpoint for live consumer sessions

`GET /health` is public. Every other route, including the websocket upgrade, requires `Authorization: Bearer $LOG_GATEWAY_TOKEN`. The process fails closed with HTTP 503 when that variable is unset.
