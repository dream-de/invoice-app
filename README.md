<img src="apps/web/public/brand/logo-horizontal.svg" alt="DreamInvoice" width="220" />

## DreamInvoice

[![CI](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)
![License](https://img.shields.io/badge/license-source--available-111827)
![Status](https://img.shields.io/badge/status-active--development-72a4df)

---

DreamInvoice is a modern invoicing and business management platform for self-hosted teams, freelancers, and small companies. It helps manage invoices, offers, customers, articles, projects, finance workflows, document templates, PDF generation, exports, user roles, and operational settings in one focused workspace.

The application can be used as a self-hosted web app and includes an isolated public demo environment for evaluation.

> **Note:** DreamInvoice is currently in active development. Some features, workflows, and UI details may still change before the first stable release. Feedback and issue reports are welcome.

- 🛡 Sicher: Schutzmechanismen, Audit Trails und role-based access sind im Produkt verankert.
- ⚡ Schnell: fokussierte Workflows und kompakte Oberflaechen reduzieren Reibung.
- 📊 Effizient: Uebersichten, Kennzahlen und Auswertungen bleiben direkt greifbar.
- ☁ Digital: Belege, PDF, Export und Freigaben sind auf digitale Abläufe ausgelegt.
- 🤝 Vertrauenswuerdig: klare Status, saubere Protokolle und nachvollziehbare Aktionen.

## Live Demo

Live Demo: [demo.dream-invoice.com](http://demo.dream-invoice.com)

### Demo Access

- Email: `demo@example.com`
- Password: `dreaminvoice`

All demo data is fictional. Changes are simulated and are not saved permanently.

![DreamInvoice dashboard](docs/assets/screenshots/dashboard.jpg)

![DreamInvoice documents](docs/assets/screenshots/documents.jpg)

![DreamInvoice articles](docs/assets/screenshots/articles.jpg)

## Premium Edition Screenshots

The Premium Edition extends the main DreamInvoice workspace with licensing, marketplace, security, audit, and administration views.

![DreamInvoice Premium dashboard](docs/screenshots/premium/dashboard-v2.png)

![DreamInvoice License billing](docs/screenshots/premium/license-billing.png)

![DreamInvoice Marketplace](docs/screenshots/premium/marketplace.png)

![DreamInvoice Audit logs](docs/screenshots/premium/audit-logs.png)

![DreamInvoice Users and permissions](docs/screenshots/premium/users-permissions.png)

![DreamInvoice Settings](docs/screenshots/premium/settings.png)

![DreamInvoice Security](docs/screenshots/premium/security.png)

![DreamInvoice Logs](docs/screenshots/premium/logs.png)

## Features

- Invoices, offers, documents, DIN A4 preview, PDF export, and visual templates
- Customers, articles, projects, finance workflows, import/export, and reporting
- Multi-language app shell, login/session protection, licensing, and user-limit enforcement
- Product Docker stack with PostgreSQL, web app, health checks, and optional proxy
- Optional demo and landing page kept separate from product/LXC installs

## GoBD-Oriented Workflows

DreamInvoice provides technical building blocks for traceable business workflows, including role-based access, audit logging, document history, PDF generation, and structured exports such as CSV.

GoBD readiness depends on the concrete deployment, operating procedures, retention policy, user roles, backup strategy, country-specific requirements, and tax advisor review. DreamInvoice does not claim official tax-authority certification.

## Workspace

- `apps/web`: main product web app
- `apps/demo`, `apps/landing-page`: optional demo and product website
- `apps/server-api`, `apps/admin`, `apps/accounting`: service and companion apps
- `apps/desktop`, `apps/pro-desktop`, `packages/desktop-*`: separated desktop and Pro workspaces
- `packages/database`, `packages/ui`, `packages/licensing`, `packages/accounting-core`: shared data, UI, licensing, and domain logic
- `docker/`, `docs/`, `tools/license/`: deployment, documentation, and license tooling

## Getting Started

For a fresh self-hosted LXC or server, install Docker first, then use the installer so secrets are generated automatically:

```bash
git clone https://github.com/dream-de/invoice-app.git dream-invoice
cd dream-invoice
chmod +x scripts/install.sh scripts/status.sh
./scripts/install.sh
```

The installer creates a private `.env`, pulls the published image `ghcr.io/dream-de/invoice-app:latest`, starts PostgreSQL, and starts the web app. Open the app at:

```text
http://SERVER-IP:3012
```

For the first local HTTP start, deployment Basic Auth is disabled so the setup screen opens directly. Create the first owner account in the browser, then enable deployment protection before exposing the installation:

```env
DREAM_INVOICE_AUTH_REQUIRED=true
AUTH_COOKIE_SECURE=true
```

Use `AUTH_COOKIE_SECURE=true` only when the public app URL uses HTTPS. Keep it `false` for local HTTP/LXC tests.

For a fully manual install, copy `.env.example` to `.env`, replace every `CHANGE_ME_*` value, then start the stack:

```bash
cp .env.example .env
nano .env
docker compose pull
docker compose up -d
```

The optional Nginx container is not started by default. Use the `proxy` profile only when you want the included Docker Nginx in front of the app:

```bash
docker compose --profile proxy up -d
```

Check the installation:

```bash
./scripts/status.sh
docker compose ps
```

Before real production use, review these values in `.env`:

- `AUTH_SECRET`
- `AUTH_COOKIE_SECURE`
- `POSTGRES_PASSWORD`
- `DREAM_INVOICE_AUTH_REQUIRED` and `DREAM_INVOICE_AUTH_PASSWORD`
- `DREAM_INVOICE_ADMIN_PASSWORD`
- `DREAM_INVOICE_LOGIN_WINDOW_MS` and `DREAM_INVOICE_LOGIN_MAX_ATTEMPTS`

## Updates

Before updating a real installation, create a database backup and keep the current `.env` private. Then update the repository and restart the stack:

```bash
git pull
docker compose pull
docker compose up -d
./scripts/status.sh
```

Maintainers who build from source instead of pulling the published image can use:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build web-app
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
http://localhost:3010
```

## Project Documentation

- [Production Deployment](./docs/deployment/production.md)
- [Production Checklist](./docs/deployment/production-checklist.md)
- [Operations Runbook](./docs/operations/runbook.md)
- [Testing](./docs/testing.md)
- [Releasing](./docs/releasing.md)
- [Security Policy](./SECURITY.md)
- [Secrets Rotation](./docs/security/secrets-rotation.md)
- [Audit Log](./docs/security/audit-log.md)
- [Roadmap](./ROADMAP.md)
- [App Structure](./docs/architecture/app-structure.md)
- [PDF Tools](./docs/pdf-tools.md)
- [Contributing](./CONTRIBUTING.md)
- [Support](./SUPPORT.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## Developer Reference

Most users only need the quick install above. The commands below are kept for maintainers and advanced self-hosted setups.

<details>
<summary>Common development commands</summary>

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
pnpm release:check       # Run release checks
pnpm release:quality     # Run full local release quality gates
pnpm security:audit      # Run dependency audit from pnpm
```

</details>

<details>
<summary>Docker commands</summary>

Start the product Docker stack manually. This pulls the published DreamInvoice image and starts DreamInvoice with PostgreSQL. Demo and landing-page services are handled by their own stack:

```bash
docker compose pull
docker compose up -d
```

The web app is available on port `3010`. To also start the optional Nginx proxy on port `80`, run:

```bash
docker compose --profile proxy up -d
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

Update the published app image:

```bash
docker compose pull
docker compose up -d
```

Build local product images for maintainer testing:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml build --no-cache
docker compose up -d
```


Run the optional website stack separately when you host the marketing site and demo:

```bash
pnpm docker:public:up
pnpm docker:public:logs
```

The website stack uses `docker/public-site.compose.yml` and uses `PUBLIC_HTTP_PORT` instead of joining the product installation.

</details>

<details>
<summary>Development Docker helpers</summary>

Start local development services only:

```bash
pnpm docker:dev:up
```

This starts PostgreSQL, Mailpit, and Adminer for local development without sending real emails.

- PostgreSQL: `127.0.0.1:55433`
- Mailpit SMTP: `127.0.0.1:1025`
- Mailpit inbox: `http://localhost:8025`
- Adminer: `http://localhost:8081`

Use `docker/development/.env.example` as the template for custom local ports or credentials. For deployment, adjust the environment values and follow [Production Deployment](./docs/deployment/production.md).

```bash
pnpm docker:dev:ps
pnpm docker:dev:logs
pnpm docker:dev:down
```

</details>

<details>
<summary>Backup and restore</summary>

Create a database backup:

```bash
docker compose exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore a database backup:

```bash
cat backup.sql | docker compose exec -T postgres psql -U dream_invoice dream_invoice
```

</details>

## License

This project is source-available and may be used, installed, and modified for private, non-commercial purposes. Commercial use, resale, paid hosting, redistribution, or use in client projects is not permitted without explicit written permission from the author.

Copyright (c) 2026 DikiTe. All rights reserved. See [LICENSE](./LICENSE).

## License Tools

License key generation, security rules, and technical license workflows are documented in [tools/license](./tools/license/README.md).
