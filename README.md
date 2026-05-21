<img src="apps/web/public/brand/dream-invoice-header-logo.png" alt="Dream Invoice" width="220" />

### Dream Invoice

---

Dream Invoice ist eine moderne Invoice-Plattform fuer Rechnungen, Angebote, Kunden, Artikel, Finanzen, Vorlagen, Demo-Flows und spaetere Desktop-Ausbaustufen.

## Features

- Rechnungen und Angebote mit DIN-A4 Vorschau, PDF-Download und Bearbeitungsworkflow
- Vorlageneditor mit Canvas, Ebenen, Eigenschaften, wiederverwendbaren Dokumentvorlagen und SEPA-QR-Grundlage
- Dokumente-Dashboard mit Suche, Statusfiltern, Auswahlaktionen und sicheren Export-Flows
- Kundenverwaltung mit Kontakten, Adressen, Projekten und erfundenen Demo-Daten fuer oeffentliche Tests
- Artikel- und Leistungskatalog mit CSV/TXT Import und Export
- Finanzbereich mit Konten, Transaktionen, Statistiken, Importpruefung und EUR-Auswertung
- Deutsch/Englisch i18n-Struktur mit Namespaces fuer spaetere weitere Sprachen
- Demo-App mit festen Beispieldaten ohne echte Kundendaten
- Landing Page fuer die oeffentliche Produktpraesentation und Demo-Verlinkung
- Desktop-Fundament fuer spaetere Electron-App, IPC-Vertraege, native Services und getrennte Pro-Ausbaustufe
- Docker-Compose Setup mit PostgreSQL, Web-App, Demo, Landing Page, Worker-Profil und Healthchecks

## Compliance-Hinweis

Dream Invoice enthaelt technische Grundlagen fuer nachvollziehbare und sichere Arbeitsablaeufe, darunter strukturierte Datenhaltung, Export-Flows, Lizenzregeln und vorbereitete Worker-Jobs.

Wichtig: Rechtliche oder steuerliche Konformitaet ist immer von Einrichtung, Prozessen, Rollen, Aufbewahrung, Dokumentation und dem jeweiligen Einsatzland abhaengig. Dream Invoice behauptet keine offizielle Zertifizierung durch Finanzbehoerden.

## Workspace

- `apps/web`: Haupt-Web-App fuer Dashboard, Dokumente, Kunden, Artikel, Finanzen und Einstellungen
- `apps/demo`: Oeffentliche Demo-App mit sicheren Beispieldaten
- `apps/landing-page`: Produktseite fuer Dream Invoice, Demo-Link und Features
- `apps/desktop`: Desktop-Fundament fuer die spaetere Electron-App
- `apps/pro-desktop`: Vorbereitete Pro-Desktop-Struktur fuer spaetere Pro-Funktionen
- `apps/server-api`: Server-API Fundament fuer getrennte Backend-Flows
- `apps/server-worker`: Worker-Fundament fuer scheduled Jobs, Erinnerungen und Automationen
- `apps/admin`: Admin-App Fundament
- `apps/accounting`: Accounting-App Fundament
- `packages/database`: Prisma Schema, Client und Datenbank-Workflows
- `packages/ui`: Gemeinsame UI-Bausteine
- `packages/licensing`: Lizenz- und Edition-Grundlagen
- `packages/desktop-*`: Getrennte Desktop-Vertraege, Services, State, Renderer und Utilities
- `docker/`: Dockerfiles, Compose-Stack und Nginx-Konfiguration
- `docs/`: Architektur, Domain-Struktur und PDF-Tooling
- `tools/license/`: Lizenzschluessel- und Sicherheitswerkzeuge

## Voraussetzungen

Installiere zuerst:

- Node.js 20+
- pnpm 10+
- Git
- Docker und Docker Compose Plugin fuer den Container-Betrieb

Pruefen:

```bash
node --version
pnpm --version
git --version
docker --version
docker compose version
```

## Getting Started

Abhaengigkeiten installieren und Prisma Client generieren:

```bash
pnpm install
pnpm db:generate
```

Web-App lokal starten:

```bash
pnpm dev:web
```

Die App laeuft dann auf:

```text
http://localhost:3000
```

## Common Commands

```bash
pnpm dev                 # Alle Dev-Tasks ueber Turbo starten
pnpm dev:web             # Haupt-Web-App starten
pnpm dev:admin           # Admin-App starten
pnpm dev:accounting      # Accounting-App starten
pnpm dev:server          # Server-App starten
pnpm build               # Alle Build-Tasks ausfuehren
pnpm lint                # Linting fuer alle Apps/Packages
pnpm typecheck           # TypeScript-Pruefung fuer alle Apps/Packages
pnpm test                # Tests fuer alle Apps/Packages
pnpm db:generate         # Prisma Client generieren
pnpm db:migrate          # Lokale Migrationen ausfuehren
pnpm db:deploy           # Migrationen fuer Deployments ausfuehren
pnpm db:studio           # Prisma Studio starten
pnpm worker:server       # Server Worker lokal ausfuehren
pnpm worker:server:smoke # Worker Smoke-Test
```

## Docker

Docker-Stack starten:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Status und Logs:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs -f
```

Datenbank pruefen:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_isready -U dream_invoice -d dream_invoice
```

Neu bauen:

```bash
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
```

Worker-Profil bauen oder ausfuehren:

```bash
pnpm docker:build:worker
pnpm docker:worker
```

## Backup

Backup erstellen:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Backup einspielen:

```bash
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U dream_invoice dream_invoice
```

## Documentation

- [App Structure](./docs/architecture/app-structure.md)
- [Domains](./docs/architecture/domains.md)
- [PDF Tools](./docs/pdf-tools.md)

## License

Dieses Projekt ist source-available und darf fuer private, nicht-kommerzielle Zwecke genutzt, installiert und veraendert werden. Kommerzielle Nutzung, Weiterverkauf, Hosting als kostenpflichtiger Dienst, Weiterverbreitung oder Nutzung in Kundenprojekten ist ohne ausdrueckliche schriftliche Genehmigung des Urhebers nicht erlaubt.

Copyright (c) 2026 DikiTe. Alle Rechte vorbehalten. Siehe [LICENSE](./LICENSE).

## License Tools

Lizenzschluessel, Sicherheitsregeln und technische Workflows liegen in [tools/license](./tools/license/README.md).

## Notes

- Keine echten Kundendaten in Demo- oder Screenshot-Daten verwenden.
- Generierte Build-Ausgaben wie `dist/`, `out/`, `.next/` und Logs nicht committen.
- Private Lizenzschluessel und produktive Umgebungsdateien gehoeren nicht ins Repository.
