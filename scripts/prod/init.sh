#!/usr/bin/env bash
source "$(dirname "${BASH_SOURCE[0]}")/common.sh"

if [[ -f "$ENV_FILE" ]]; then
  echo "O .env.production já existe; nada foi alterado."
  exit 0
fi

domain="${1:-}"
if [[ -z "$domain" ]]; then
  read -r -p "Endereço HTTPS do túnel (ex.: https://mesa.playit.plus): " domain
fi
domain="${domain%/}"
if [[ "$domain" != https://* ]]; then
  echo "O endereço precisa começar com https:// (o cookie de sessão só vale por HTTPS)." >&2
  exit 1
fi

secret() { openssl rand -hex "$1"; }

umask 077
sed \
  -e "s|^WEB_ORIGIN=.*|WEB_ORIGIN=${domain}|" \
  -e "s|^SITE_DOMAIN=.*|SITE_DOMAIN=${domain#https://}|" \
  -e "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=$(secret 24)|" \
  -e "s|^JWT_SECRET=.*|JWT_SECRET=$(secret 48)|" \
  -e "s|^S3_SECRET_KEY=.*|S3_SECRET_KEY=$(secret 24)|" \
  "$ROOT/.env.production.example" > "$ENV_FILE"
echo "Criado .env.production com segredos novos para ${domain}."
echo "Guarde uma cópia dele junto dos backups: sem ele os backups não abrem."
