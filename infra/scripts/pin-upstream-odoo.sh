#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TARGET_DIR="$REPO_ROOT/upstream/odoo-community"
UPSTREAM_REMOTE="https://github.com/odoo/odoo.git"
UPSTREAM_REF="19.0"

if [[ -d "$TARGET_DIR/.git" ]]; then
  echo "[pin-upstream] Existing upstream checkout found; refreshing"
  git -C "$TARGET_DIR" fetch origin "$UPSTREAM_REF" --depth 1
  git -C "$TARGET_DIR" checkout FETCH_HEAD
else
  rm -rf "$TARGET_DIR"
  git clone --depth 1 --branch "$UPSTREAM_REF" "$UPSTREAM_REMOTE" "$TARGET_DIR"
fi

COMMIT_SHA="$(git -C "$TARGET_DIR" rev-parse HEAD)"

cat > "$REPO_ROOT/upstream/odoo-community.lock" <<LOCK
{
  "remote": "$UPSTREAM_REMOTE",
  "ref": "$UPSTREAM_REF",
  "commit": "$COMMIT_SHA",
  "pinned_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
LOCK

echo "[pin-upstream] pinned commit: $COMMIT_SHA"
