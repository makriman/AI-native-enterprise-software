# First Install Runbook

1. Clone repository.
2. Run `./infra/scripts/bootstrap.sh`.
3. Copy `infra/compose/.env.example` to `infra/compose/.env` and rotate credentials.
4. Start stack:
   ```bash
   docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build
   ```
5. Confirm health:
   - `http://localhost:4000/health`
   - `http://localhost:3000`
   - `http://localhost:8069`
