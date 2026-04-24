#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$REPO_ROOT"

if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable
fi

pnpm install

if [[ ! -d "$REPO_ROOT/upstream/odoo-community/.git" ]]; then
  echo "[bootstrap] upstream Odoo baseline missing; running pin script"
  "$REPO_ROOT/infra/scripts/pin-upstream-odoo.sh"
fi

cp -n "$REPO_ROOT/infra/compose/.env.example" "$REPO_ROOT/infra/compose/.env" || true

echo "[bootstrap] workspace prepared"
echo "[bootstrap] run: docker compose -f infra/compose/docker-compose.yml --env-file infra/compose/.env up -d --build"
