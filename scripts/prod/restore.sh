#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env

source_dir="${1:-}"
if [[ -z "$source_dir" || ! -f "$source_dir/db.dump" || ! -d "$source_dir/storage" ]]; then
  echo "Uso: npm run prod:restore -- <pasta do backup com db.dump e storage/>" >&2
  exit 1
fi

read -r -p "Isso substitui TODOS os dados da produção pelos de $source_dir. Digite RESTAURAR para seguir: " answer
if [[ "$answer" != "RESTAURAR" ]]; then
  echo "Cancelado."
  exit 1
fi

compose up -d db storage
compose stop caddy web api
compose exec -T db pg_restore -U "$POSTGRES_USER" -d "$POSTGRES_DB" --clean --if-exists --no-owner < "$source_dir/db.dump"
"$ROOT/scripts/prod/cli.sh" storage:restore "$source_dir/storage"
compose up -d
wait_healthy
