# Invoice Platform

Invoice Platform ist eine webbasierte App fuer Rechnungen, Angebote, Kunden, Artikel, Finanzen und Unternehmenseinstellungen.

## Funktionen

- Rechnungen und Angebote verwalten
- DIN-A4 Dokumentvorschau
- Kundenverwaltung
- Artikel- und Leistungskatalog
- CSV/TXT-Import fuer Artikel und Empfaengerdaten
- Finanzbereich mit Konten, Transaktionen, Statistiken und EUR-Auswertung
- Unternehmensdaten, Bankdaten und Nummernkreise speichern
- PostgreSQL-Datenbank
- Prisma-Migrationen
- Docker-Compose-Installation

## Voraussetzungen

Installiere zuerst:

- Git
- Docker
- Docker Compose Plugin

Pruefen:

```bash
git --version
docker --version
docker compose version

## Backup

Backup erstellen:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U postgres invoice_platform > backup.sql
```

Backup einspielen:

```bash
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U postgres invoice_platform
```

## Nuetzliche Docker-Befehle

Status:

```bash
docker compose -f docker/docker-compose.yml ps
```

Logs:

```bash
docker compose -f docker/docker-compose.yml logs -f
```

Datenbank pruefen:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_isready -U postgres -d invoice_platform
```

Migrationen manuell ausfuehren:

```bash
docker compose -f docker/docker-compose.yml exec invoice-app pnpm --filter @invoice-platform/database db:deploy
```

Neu bauen:

```bash
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
```

## Entwicklung ohne Docker

Nur fuer Entwickler:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev:invoice
```

Die App laeuft dann auf:

```text
http://localhost:3000
```

## Lizenz

<sub>Dieses Projekt ist source-available und darf fuer private, nicht-kommerzielle Zwecke genutzt, installiert und veraendert werden. Kommerzielle Nutzung, Weiterverkauf, Hosting als kostenpflichtiger Dienst, Weiterverbreitung oder Nutzung in Kundenprojekten ist ohne ausdrueckliche schriftliche Genehmigung des Urhebers nicht erlaubt. Copyright (c) 2026 DikiTe. Alle Rechte vorbehalten. Siehe [LICENSE](./LICENSE).</sub>

## Lizenzschluessel

Die App prueft Lizenzschluessel mit einem Public Key ueber `LICENSE_PUBLIC_KEY`.
Der passende Private Key bleibt ausschliesslich beim Anbieter und darf nicht in GitHub,
Docker Images oder Kundeninstallationen gespeichert werden.

Lokalen Lizenzschluessel erzeugen:

```bash
LICENSE_PRIVATE_KEY="$(cat private-license-key.pem)" node tools/license/generate-license-key.mjs \
  --plan=starter \
  --billing=monthly \
  --days=30 \
  --customer="Demo Kunde"
```

Unterstuetzte Plaene: `free`, `starter`, `team`, `business`, `enterprise`, `unlimited`.
