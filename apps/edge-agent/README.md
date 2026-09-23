# edge-agent

Edge execution daemon for ChatGPT-linked Codex mode.

## Current capabilities
- register with control plane
- heartbeat updates
- poll and execute lightweight local jobs
- upload completion metadata

`AGENT_TOKEN` is required and must match the control API `EDGE_AGENT_TOKEN`. The agent sends it as a bearer token and in the registration body. It does not start when `AGENT_TOKEN` is unset.

## Run
```bash
pnpm --filter @oae/edge-agent dev
```
