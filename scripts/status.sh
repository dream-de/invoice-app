#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

auth_args=""
if [ -f "$ENV_FILE" ]; then
  auth_user="$(grep '^DREAM_INVOICE_AUTH_USER=' "$ENV_FILE" | tail -1 | cut -d= -f2- | sed 's/^"//; s/"$//' || true)"
  auth_password="$(grep '^DREAM_INVOICE_AUTH_PASSWORD=' "$ENV_FILE" | tail -1 | cut -d= -f2- | sed 's/^"//; s/"$//' || true)"
  if [ -n "$auth_password" ]; then
    auth_args="-u ${auth_user:-admin}:$auth_password"
  fi
fi

cd "$ROOT_DIR"

docker compose ps
echo
# shellcheck disable=SC2086
curl -s $auth_args -o /dev/null -w "%{http_code} /login\n" http://127.0.0.1/login || true
# shellcheck disable=SC2086
curl -s $auth_args -o /dev/null -w "%{http_code} /dashboard no-app-session\n" http://127.0.0.1/dashboard || true
# shellcheck disable=SC2086
curl -s $auth_args -o /dev/null -w "%{http_code} /api/invoice/list no-app-session\n" http://127.0.0.1/api/invoice/list || true
