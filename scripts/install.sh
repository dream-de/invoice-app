#!/bin/sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
ENV_FILE="$ROOT_DIR/.env"

random_secret() {
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$1" | tr -d '\n'
  else
    date +%s | sha256sum | awk '{print $1}'
  fi
}

need_command() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "Missing required command: $1"
    echo "Install Docker, Git, and OpenSSL first, then run this script again."
    exit 1
  fi
}

need_command docker

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose plugin is missing."
  echo "Install docker-compose-plugin or Docker Engine from the official Docker repository."
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  POSTGRES_PASSWORD="$(random_secret 32)"
  AUTH_SECRET="$(random_secret 32)"
  DEPLOYMENT_PASSWORD="$(random_secret 24)"
  ADMIN_PASSWORD="$(random_secret 24)"

  umask 077
  cat > "$ENV_FILE" <<EOF
NODE_ENV=production
NEXT_PUBLIC_APP_NAME="Dream Invoice"

AUTH_SECRET="$AUTH_SECRET"
AUTH_COOKIE_SECURE=false

DREAM_INVOICE_AUTH_USER=admin
DREAM_INVOICE_AUTH_PASSWORD="$DEPLOYMENT_PASSWORD"
DREAM_INVOICE_AUTH_REQUIRED=false

DREAM_INVOICE_ADMIN_USER=admin
DREAM_INVOICE_ADMIN_PASSWORD="$ADMIN_PASSWORD"
DREAM_INVOICE_ADMIN_AUTH_REQUIRED=true

DREAM_INVOICE_LOGIN_WINDOW_MS=900000
DREAM_INVOICE_LOGIN_MAX_ATTEMPTS=8

HTTP_PORT=80
WEB_PORT=3012
POSTGRES_PORT=127.0.0.1:55433
NEXT_PUBLIC_APP_URL=http://localhost:3012

POSTGRES_USER=dream_invoice
POSTGRES_PASSWORD="$POSTGRES_PASSWORD"
POSTGRES_DB=invoice_platform

LICENSE_PUBLIC_KEY=""


DREAM_INVOICE_IMAGE=ghcr.io/dream-de/invoice-app:latest
EOF
  chmod 600 "$ENV_FILE"
  CREATED_ENV=1
else
  CREATED_ENV=0
fi

cd "$ROOT_DIR"

echo "Starting Dream Invoice product stack..."
docker compose pull
docker compose up -d

echo
echo "Dream Invoice is starting."
echo "Status:"
docker compose ps
echo
echo "Open:"
echo "  http://<your-server-ip>:3012/"
echo
if [ "$CREATED_ENV" = "1" ]; then
  echo "Basic Auth is disabled for the first local HTTP start."
  echo "Enable DREAM_INVOICE_AUTH_REQUIRED=true in .env before exposing a production installation."
  echo
  echo "Secrets were written to:"
  echo "  $ENV_FILE"
else
  echo "Existing .env was kept unchanged."
fi
