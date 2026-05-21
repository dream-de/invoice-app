<p align="center">
  <img src="apps/web/public/brand/dream-invoice-header-logo.png" alt="Dream Invoice" width="260" />
</p>

# Dream Invoice

Dream Invoice ist eine webbasierte App fuer Rechnungen, Angebote, Kunden, Artikel, Finanzen und Unternehmenseinstellungen.

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
```

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
docker compose -f docker/docker-compose.yml exec web-app pnpm --filter @dream-invoice/database db:deploy
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
pnpm dev:web
```

Die App laeuft dann auf:

```text
http://localhost:3000
```

## Lizenz

<sub>Dieses Projekt ist source-available und darf fuer private, nicht-kommerzielle Zwecke genutzt, installiert und veraendert werden. Kommerzielle Nutzung, Weiterverkauf, Hosting als kostenpflichtiger Dienst, Weiterverbreitung oder Nutzung in Kundenprojekten ist ohne ausdrueckliche schriftliche Genehmigung des Urhebers nicht erlaubt. Copyright (c) 2026 DikiTe. Alle Rechte vorbehalten. Siehe [LICENSE](./LICENSE).</sub>

## Lizenz-Tools

Lizenzschluessel, Sicherheitsregeln und technische Workflows liegen in [tools/license](./tools/license/README.md).
