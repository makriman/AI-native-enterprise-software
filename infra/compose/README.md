# Docker Compose Stack

Primary local stack file: `infra/compose/docker-compose.yml`.

Includes:
- reverse proxy
- ai-console
- control-api
- runner-supervisor
- edge-agent (optional profile)
- log-gateway
- control-plane Postgres
- Redis
- MinIO
- Odoo + Odoo Postgres

Usage:
```bash
docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build
```

Copy `.env.example` to an untracked `.env` and replace every `replace-with-random-token` value before the first start. Required names are listed in `docs/security/secrets.md`.
