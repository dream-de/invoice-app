<img src="apps/web/public/brand/dream-invoice-readme-logo.png" alt="Dream Invoice" width="220" />

## Dream Invoice

[![CI](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml/badge.svg)](https://github.com/dream-de/invoice-app/actions/workflows/ci.yml)
![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6)
![License](https://img.shields.io/badge/license-source--available-111827)
![Status](https://img.shields.io/badge/status-active--development-72a4df)

---

Dream Invoice is a modern invoicing platform for invoices, offers, customers, articles, finance workflows, document templates, and self-hosted business operations.

## Documentation

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

## Features

- Invoices, offers, documents, DIN A4 preview, PDF export, and visual templates
- Customers, articles, projects, finance workflows, import/export, and reporting
- Multi-language app shell, login/session protection, licensing, and user-limit enforcement
- Product Docker stack with PostgreSQL, web app, app proxy, health checks, and optional worker
- Optional demo and landing page kept separate from product/LXC installs

## Compliance Note

Dream Invoice provides technical building blocks for traceable business workflows. Legal, tax, and accounting compliance still depends on each deployment, process, role setup, retention policy, and country. Dream Invoice does not claim official tax-authority certification.

## Workspace

- `apps/web`: main product web app
- `apps/demo`, `apps/landing-page`: optional demo and product website
- `apps/server-worker`, `apps/server-api`, `apps/admin`, `apps/accounting`: service and companion apps
- `apps/desktop`, `apps/pro-desktop`, `packages/desktop-*`: separated desktop and Pro workspaces
- `packages/database`, `packages/ui`, `packages/licensing`, `packages/accounting-core`: shared data, UI, licensing, and domain logic
- `docker/`, `docs/`, `tools/license/`: deployment, documentation, and license tooling

## Live Demo

Demo: [↗ Demo](https://demo.dream-invoice.com)

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

The product stack starts PostgreSQL, the Dream Invoice web app, and the app proxy. Demo and landing-page services stay in a separate stack.

---

Default access for the first test start:

- User: `admin`
- Password: `dreaminvoice`

---

Before real production use, change all default passwords and secrets in `.env`, especially the values below, or generate strong passwords with `openssl rand -base64 32`

- `AUTH_SECRET`
- `AUTH_COOKIE_SECURE` (set to `true` when the public app URL uses HTTPS)
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

The installer creates a local `.env` file with generated secrets, starts the same product Docker stack, and prints the generated deployment password.

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
pnpm release:check       # Run release checks
pnpm release:quality     # Run full local release quality gates
pnpm security:audit      # Run dependency audit from pnpm
```

## Docker

Start the product Docker stack manually. Use `--build` when you want to force a fresh image build. This installs Dream Invoice, PostgreSQL, and the app proxy only. Demo and landing-page services are handled by their own stack:

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

Run the optional website stack separately when you host the marketing site and demo:

```bash
pnpm docker:public:up
pnpm docker:public:logs
```

The website stack uses `docker/public-site.compose.yml` and uses `PUBLIC_HTTP_PORT` instead of joining the product installation.

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

Use `docker/development/.env.example` as the template for custom local ports or credentials. For deployment, adjust the environment values and follow [Production Deployment](./docs/deployment/production.md).

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

## License

This project is source-available and may be used, installed, and modified for private, non-commercial purposes. Commercial use, resale, paid hosting, redistribution, or use in client projects is not permitted without explicit written permission from the author.

Copyright (c) 2026 DikiTe. All rights reserved. See [LICENSE](./LICENSE).

## License Tools

License key generation, security rules, and technical license workflows are documented in [tools/license](./tools/license/README.md).
