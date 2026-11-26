#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env

if ! compose ps --status running --services | grep -qx db; then
  echo "Sem backup: a produção está desligada (npm run prod:up)." >&2
  exit 1
fi

target="$BACKUP_DIR/$(date +%Y-%m-%d_%H%M%S)"
mkdir -p "$target"
compose exec -T db pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$target/db.dump"
"$ROOT/scripts/prod/cli.sh" storage:dump "$target/storage"
echo "Backup em $target"

mapfile -t old < <(find "$BACKUP_DIR" -mindepth 1 -maxdepth 1 -type d -name '20*' | sort | head -n "-${BACKUP_KEEP}")
for dir in "${old[@]}"; do rm -rf -- "$dir"; done
