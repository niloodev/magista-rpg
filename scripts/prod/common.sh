#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
ENV_FILE="${MAGISTA_PROD_ENV_FILE:-$ROOT/.env.production}"
COMPOSE_FILE="$ROOT/docker-compose.prod.yml"

require_env() {
  if [[ ! -f "$ENV_FILE" ]]; then
    echo "Falta o .env.production. Rode antes: npm run prod:init" >&2
    exit 1
  fi
  set -a
  source "$ENV_FILE"
  set +a
  PROD_HTTP_PORT="${PROD_HTTP_PORT:-80}"
  PROD_DB_PORT="${PROD_DB_PORT:-5435}"
  PROD_STORAGE_PORT="${PROD_STORAGE_PORT:-8334}"
  BACKUP_DIR="${BACKUP_DIR:-$ROOT/backups}"
  BACKUP_KEEP="${BACKUP_KEEP:-10}"
}

compose() {
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" "$@"
}

wait_healthy() {
  local url="http://127.0.0.1:${PROD_HTTP_PORT}/api/health"
  for _ in $(seq 1 90); do
    if curl -fsS "$url" >/dev/null 2>&1; then
      echo "Mesa no ar: ${WEB_ORIGIN} (local: http://127.0.0.1:${PROD_HTTP_PORT})"
      return 0
    fi
    sleep 2
  done
  echo "A API não respondeu em $url. Veja: npm run prod:logs" >&2
  return 1
}

use_node() {
  if [[ "$(node -v 2>/dev/null)" == v24.* ]]; then
    return 0
  fi
  if [[ -s "$HOME/.nvm/nvm.sh" ]]; then
    source "$HOME/.nvm/nvm.sh"
    nvm use "$(cat "$ROOT/.nvmrc")" >/dev/null
  fi
}
