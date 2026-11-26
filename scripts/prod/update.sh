#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env
use_node
(cd "$ROOT" && npm run --silent version:bump)
echo "Versão do app: $(node -p "require('$ROOT/apps/web/package.json').version")"
if compose ps --status running --services | grep -qx db; then
  "$ROOT/scripts/prod/backup.sh"
fi
compose up -d --build --remove-orphans
wait_healthy
