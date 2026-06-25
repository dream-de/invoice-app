# Web-Pro Preview Service

Status: Vorbereitung, nicht produktiv aktiv.

```text
Aktive Runtime: apps/web
Aktiver produktiver Host-Port: unveraendert, z. B. 3012
Web-Pro Preview-Port: 3020
Compose-Datei: docker-compose.web-pro.example.yml
Profil: web-pro-preview
```

## Zweck

`apps/web-pro` kann als separater Preview-Service gebaut und gestartet werden, ohne den aktiven `web-app` Container zu ersetzen. Die Preview nutzt dieselbe Dashboard-v2/PremiumWorkspace-Komponente aus `apps/web` und die gemeinsamen Premium-Bausteine aus `@dream-invoice/premium`.

Die Preview darf keine eigene Mini-App-Shell, keine eigene Sidebar und keine abweichende Premium-Navigation einfuehren. Sie ist technisch getrennt, soll aber visuell wie die bestehende DreamInvoice Dashboard-v2 App wirken.

## Lokal ohne Docker pruefen

```bash
pnpm --filter @dream-invoice/web-pro typecheck
pnpm --filter @dream-invoice/web-pro build
WEB_PRO_PORT=3020 pnpm --filter @dream-invoice/web-pro start
```

Healthcheck:

```bash
curl http://127.0.0.1:3020/api/health
```

UI:

```text
http://127.0.0.1:3020/dashboard-v2
http://127.0.0.1:3020/dashboard-v2/settings
http://127.0.0.1:3020/dashboard-v2/settings/license-billing
http://127.0.0.1:3020/dashboard-v2/settings/license-billing/marketplace
http://127.0.0.1:3020/dashboard-v2/settings/license-billing/advanced-activation
```

## Docker Preview starten

Die Preview wird nur gestartet, wenn die separate Compose-Datei und das Profil explizit angegeben werden:

```bash
docker compose -f docker-compose.yml -f docker-compose.web-pro.example.yml --profile web-pro-preview up --build web-pro-app
```

Der aktive `web-app` Service in `docker-compose.yml` bleibt unveraendert. Port `3012` darf fuer Web-Pro nicht verwendet werden; empfohlen ist `3020`.

## Docker Preview stoppen

```bash
docker compose -f docker-compose.yml -f docker-compose.web-pro.example.yml --profile web-pro-preview stop web-pro-app
```

## Vor echter Umschaltung offen

- Auth/Layout-Shell produktionsreif pruefen.
- Produktive Dashboard-v2 Premium-Routen schrittweise in die Web-Pro Ownership ueberfuehren.
- Lizenz- und Premium-APIs als Shared Handler oder Web-Pro-Routen vorbereiten.
- Datenbank-, Auth- und License-Env im Runtime-Kontext testen.
- Smoke-Test fuer `/dashboard-v2`, `/dashboard-v2/settings`, `/dashboard-v2/settings/license-billing`, `/dashboard-v2/settings/license-billing/marketplace` und `/api/health`.
- Erst danach Dockerfile oder aktiven `web-app` Service umstellen.

## Runtime-ENV

Web-Pro bleibt Preview auf Port 3020. Fuer Enterprise-/Offline-Tests sind nur vorbereitete ENV-Schalter vorgesehen:

```bash
DREAM_INVOICE_RUNTIME=web-pro-preview
LICENSE_ACTIVATION_MODE=cloud # cloud | enterprise | offline | self-hosted | trial | demo
LICENSE_OFFLINE_MODE=false
NEXT_PUBLIC_LICENSE_RUNTIME=web-pro-preview
LICENSE_ENTERPRISE_CUSTOMER_ID=
LICENSE_OFFLINE_FILE_PATH=
LICENSE_SYNC_ENDPOINT=
LICENSE_SELF_HOSTED=false
```

Diese Variablen aendern keinen produktiven Container und stellen Port 3012 nicht um.
