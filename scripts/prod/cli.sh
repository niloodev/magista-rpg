#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"
require_env

if [[ $# -lt 1 ]]; then
  echo 'Uso: npm run prod:cli -- <comando> [argumentos] (ex.: account:create-gm "Mestre")' >&2
  exit 1
fi

export NODE_ENV=production
export COOKIE_SECURE=true
export DEV_QUICK_LOGIN=false
export DEV_FORCED_D20=
export DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@127.0.0.1:${PROD_DB_PORT}/${POSTGRES_DB}"
export S3_ENDPOINT="http://127.0.0.1:${PROD_STORAGE_PORT}"
export S3_ACCESS_KEY S3_SECRET_KEY JWT_SECRET WEB_ORIGIN

if ! compose ps --status running --services | grep -qx db; then
  echo "A produção está desligada. Rode antes: npm run prod:up" >&2
  exit 1
fi

use_node
command="$1"
shift
npm --prefix "$ROOT" run --silent "$command" -- "$@"
