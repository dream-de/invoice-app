<img src="apps/web/public/brand/dream-invoice-readme-logo.png" alt="Dream Invoice" width="220" />

## Dream Invoice

[![CI](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)
![License](https://img.shields.io/badge/license-source--available-111827)
![Status](https://img.shields.io/badge/status-active--development-72a4df)

---

Dream Invoice is a modern invoicing platform for invoices, offers, customers, articles, finance workflows, document templates, and safe public testing.

## Features

- Invoice and offer management with DIN A4 preview, PDF download, and editing workflows
- Visual template editor with canvas, layers, properties, reusable document templates, and SEPA QR preparation
- Documents dashboard with search, status filters, bulk selection, and safe export flows
- Customer management with contacts, addresses, projects, and fictional demo data for public testing
- Article and service catalog with CSV/TXT import and export workflows
- Finance area with accounts, transactions, statistics, import checks, and EUR reporting preparation
- German and English i18n structure with room for additional languages
- Public demo app with fixed sample data and no real customer data
- Landing page for product positioning, screenshots, features, and demo links
- Desktop, Pro, admin, accounting, API, and worker workspaces kept separate from the product web app
- Product Docker Compose setup with PostgreSQL, web app, app proxy, optional worker profile, and health checks

## Compliance Note

Dream Invoice includes technical building blocks for traceable and safe business workflows, including structured data storage, export flows, license rules, and prepared worker jobs.

Important: legal, tax, and accounting compliance always depends on setup, processes, roles, retention, documentation, and the country where the software is used. Dream Invoice does not claim an official certification by any tax authority.

## Workspace

- `apps/web`: main product web app for dashboard, documents, customers, articles, finance, and settings
- `apps/demo`: optional public demo with safe sample data
- `apps/landing-page`: optional public product website
- `apps/server-worker`: optional private worker for scheduled jobs, reminders, and automations
- `apps/server-api`, `apps/admin`, `apps/accounting`: separated backend/admin/accounting workspaces
- `apps/desktop`, `apps/pro-desktop`, `packages/desktop-*`: separated desktop and Pro workspaces
- `packages/database`: Prisma schema, client, and database workflows
- `packages/ui`, `packages/licensing`, `packages/accounting-core`: shared UI, licensing, and accounting logic
- `assets/accounting/`: accounting manifests and chart-of-accounts assets
- `docker/`: product and optional public-site Docker stacks
- `docs/`: deployment, operations, architecture, domain, and PDF notes
- `tools/license/`: license key and security tooling

## Live Demo

Public demo: https://demo.dream-invoice.com

## Quick Install

For a fresh self-hosted LXC or server, install Docker first, then run:

```bash

git clone https://github.com/dream-de/invoice-app.git
cd invoice-app
cp .env.example .env
nano .env
```

Start the stack:

```bash

docker compose up -d
```

The product stack starts PostgreSQL, the Dream Invoice web app, and the app proxy. The public demo and landing page are not installed in this customer stack.

---

Default access for the first test start:

- User: `admin`
- Password: `dreaminvoice`

---

Before real production use, change all default passwords and secrets in `.env`, especially the values below, or generate strong passwords with `openssl rand -base64 32`:

- `AUTH_SECRET`
- `POSTGRES_PASSWORD`
- `DREAM_INVOICE_AUTH_PASSWORD`
- `DREAM_INVOICE_ADMIN_PASSWORD`

---

## Install With Auto-Generated Secrets

If you want the installer to create random secrets automatically, use:

```bash

git clone https://github.com/dream-de/invoice-app.git
cd invoice-app
chmod +x scripts/install.sh scripts/status.sh
./scripts/install.sh
```

The installer creates a private `.env` file with generated secrets, starts the same product Docker stack, and prints the generated deployment password.

After installation, check the stack:

```bash
./scripts/status.sh
```

## Development Setup

Install dependencies and generate the Prisma client:

```bash
pnpm install
pnpm db:generate
```

Start the main web app locally:

```bash
pnpm dev:web
```

The app will be available at:

```text
http://localhost:3000
```

## Common Commands

```bash
pnpm dev                 # Start all development tasks through Turbo
pnpm dev:web             # Start the main web app
pnpm dev:admin           # Start the admin app
pnpm dev:accounting      # Start the accounting app
pnpm dev:server          # Start the server app
pnpm build               # Run all build tasks
pnpm lint                # Run linting for apps and packages
pnpm typecheck           # Run TypeScript checks for apps and packages
pnpm test                # Run tests for apps and packages
pnpm db:generate         # Generate the Prisma client
pnpm db:migrate          # Run local database migrations
pnpm db:deploy           # Run deployment migrations
pnpm db:studio           # Open Prisma Studio
pnpm worker:server       # Run the server worker locally
pnpm worker:server:smoke # Run the worker smoke test
pnpm release:check       # Run public release safety checks
pnpm release:quality     # Run full local release quality gates
pnpm security:audit      # Run dependency audit from pnpm
```

## Docker

Start the product Docker stack manually. Use `--build` when you want to force a fresh image build. This installs Dream Invoice, PostgreSQL, and the app proxy only. The public demo and marketing landing page are not part of this customer/LXC stack and are removed from the product runtime image:

```bash
docker compose up -d
```

Check status and logs:

```bash
docker compose ps
docker compose logs -f
```

Check the database:

```bash
docker compose exec postgres pg_isready -U dream_invoice -d dream_invoice
```

Rebuild the stack:

```bash
docker compose build --no-cache
docker compose up -d
```

Build or run the worker profile:

```bash
pnpm docker:build:worker
pnpm docker:worker
```

Run the optional public website stack separately when you intentionally host the marketing site and demo:

```bash
pnpm docker:public:up
pnpm docker:public:logs
```

The public stack uses `docker/public-site.compose.yml` and exposes `PUBLIC_HTTP_PORT` instead of joining the product installation.

## Development Docker Helpers

Start local development services only:

```bash
pnpm docker:dev:up
```

This starts PostgreSQL, Mailpit, and Adminer for local development without sending real emails.

- PostgreSQL: `127.0.0.1:55433`
- Mailpit SMTP: `127.0.0.1:1025`
- Mailpit inbox: `http://localhost:8025`
- Adminer: `http://localhost:8081`

Use `docker/development/.env.example` as the template for custom local ports or credentials. For production, replace all development defaults and follow [Production Deployment](./docs/deployment/production.md).

```bash
pnpm docker:dev:ps
pnpm docker:dev:logs
pnpm docker:dev:down
```

## Backup

Create a database backup:

```bash
docker compose exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore a database backup:

```bash
cat backup.sql | docker compose exec -T postgres psql -U dream_invoice dream_invoice
```

## Documentation

- [Roadmap](./ROADMAP.md)
- [Contributing](./CONTRIBUTING.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)
- [Production Deployment](./docs/deployment/production.md)
- [Production Checklist](./docs/deployment/production-checklist.md)
- [Operations Runbook](./docs/operations/runbook.md)
- [Audit Log](./docs/security/audit-log.md)
- [Secrets Rotation](./docs/security/secrets-rotation.md)
- [Testing](./docs/testing.md)
- [Releasing](./docs/releasing.md)
- [App Structure](./docs/architecture/app-structure.md)
- [Domains](./docs/architecture/domains.md)
- [PDF Tools](./docs/pdf-tools.md)

## License

This project is source-available and may be used, installed, and modified for private, non-commercial purposes. Commercial use, resale, paid hosting, redistribution, or use in client projects is not permitted without explicit written permission from the author.

Copyright (c) 2026 DikiTe. All rights reserved. See [LICENSE](./LICENSE).

## License Tools

License key generation, security rules, and technical license workflows are documented in [tools/license](./tools/license/README.md).
