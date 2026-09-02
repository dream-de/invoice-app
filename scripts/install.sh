#!/bin/sh
set -eu

# Root-Verzeichnis des Projekts bestimmen
ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "🔧 Starte automatische Installation von DreamInvoice..."

###############################################################################
# 1. Prüfen ob Docker vorhanden ist
###############################################################################
if ! command -v docker >/dev/null 2>&1; then
  echo "❌ Docker ist nicht installiert."
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "❌ Docker Compose Plugin fehlt."
  exit 1
fi

###############################################################################
# 2. Postgres installieren (falls nicht vorhanden)
###############################################################################
echo "📦 Prüfe Postgres Image..."

if ! docker image inspect postgres:16-alpine >/dev/null 2>&1; then
  echo "📥 Lade Postgres..."
  docker pull postgres:16-alpine || {
    echo "❌ Postgres konnte nicht installiert werden."
    exit 1
  }
else
  echo "✔ Postgres bereits vorhanden."
fi

###############################################################################
# 3. Web-App installieren (GHCR → Fallback → Lokal bauen)
###############################################################################
echo "📦 Installiere DreamInvoice Web-App..."

if docker pull ghcr.io/dream-de/invoice-app:latest; then
  echo "✔ GHCR Image erfolgreich geladen."
  export DREAM_INVOICE_IMAGE="ghcr.io/dream-de/invoice-app:latest"
else
  echo "⚠ GHCR nicht erreichbar – baue lokales Image..."
  docker build -f docker/Dockerfile -t dream-invoice-local .
  export DREAM_INVOICE_IMAGE="dream-invoice-local"
fi

###############################################################################
# 4. Docker Compose starten
###############################################################################
echo "🚀 Starte Services..."
docker compose up -d

###############################################################################
# 5. Status anzeigen
###############################################################################
echo "🎉 Installation abgeschlossen!"
echo
echo "📊 Status:"
docker compose ps
echo
echo "🌐 Öffne im Browser:"
echo "  http://<server-ip>:3010/"
echo
echo "✔ DreamInvoice läuft."
