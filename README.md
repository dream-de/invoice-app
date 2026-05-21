<img src="apps/web/public/brand/dream-invoice-readme-logo.png" alt="Dream Invoice" width="220" />

### **Dream Invoice**

---

Dream Invoice is a modern invoicing platform for invoices, offers, customers, articles, finance workflows, document templates, public demo flows, and future desktop editions.

## Features

- Invoice and offer management with DIN A4 preview, PDF download, and editing workflows
- Visual template editor with canvas, layers, properties, reusable document templates, and SEPA QR foundations
- Documents dashboard with search, status filters, bulk selection, and safe export flows
- Customer management with contacts, addresses, projects, and fictional demo data for public testing
- Article and service catalog with CSV/TXT import and export workflows
- Finance area with accounts, transactions, statistics, import checks, and EUR reporting foundations
- German and English i18n structure with namespaces for future languages
- Public demo app with fixed sample data and no real customer data
- Landing page for product positioning, screenshots, features, and demo links
- Desktop foundation for future Electron builds, IPC contracts, native services, and a separate Pro edition path
- Docker Compose setup with PostgreSQL, web app, demo app, landing page, worker profile, and health checks

## Compliance Note

Dream Invoice includes technical foundations for traceable and safe business workflows, including structured data storage, export flows, license rules, and prepared worker jobs.

Important: legal, tax, and accounting compliance always depends on setup, processes, roles, retention, documentation, and the country where the software is used. Dream Invoice does not claim an official certification by any tax authority.

## Workspace

- `apps/web`: main web app for dashboard, documents, customers, articles, finance, and settings
- `apps/demo`: public demo app with safe sample data
- `apps/landing-page`: product landing page for Dream Invoice, demo links, and features
- `apps/desktop`: desktop foundation for the future Electron app
- `apps/pro-desktop`: prepared Pro desktop structure for future Pro features
- `apps/server-api`: server API foundation for separated backend flows
- `apps/server-worker`: worker foundation for scheduled jobs, reminders, and automations
- `apps/admin`: admin app foundation
- `apps/accounting`: accounting app foundation
- `packages/accounting-core`: accounting domain and journal foundations
- `packages/accounting-data`: international accounting data catalog foundations
- `packages/database`: Prisma schema, client, and database workflows
- `packages/ui`: shared UI building blocks
- `packages/licensing`: licensing and edition foundations
- `packages/desktop-*`: separated desktop contracts, services, state, renderer, and utilities
- `docker/`: Dockerfiles, Compose stack, and Nginx configuration
- `docs/`: architecture, domain structure, and PDF tooling notes
- `tools/license/`: license key and security tooling

## Prerequisites

Install first:

- Node.js 20+
- pnpm 10+
- Git
- Docker and the Docker Compose plugin for container-based setups

Check your tools:

```bash
node --version
pnpm --version
git --version
docker --version
docker compose version
```

## Getting Started

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
```

## Docker

Start the Docker stack:

```bash
docker compose -f docker/docker-compose.yml up -d
```

Check status and logs:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs -f
```

Check the database:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_isready -U dream_invoice -d dream_invoice
```

Rebuild the stack:

```bash
docker compose -f docker/docker-compose.yml build --no-cache
docker compose -f docker/docker-compose.yml up -d
```

Build or run the worker profile:

```bash
pnpm docker:build:worker
pnpm docker:worker
```

## Backup

Create a database backup:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore a database backup:

```bash
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U dream_invoice dream_invoice
```

## Documentation

- [App Structure](./docs/architecture/app-structure.md)
- [Domains](./docs/architecture/domains.md)
- [PDF Tools](./docs/pdf-tools.md)

## License

This project is source-available and may be used, installed, and modified for private, non-commercial purposes. Commercial use, resale, paid hosting, redistribution, or use in client projects is not permitted without explicit written permission from the author.

Copyright (c) 2026 DikiTe. All rights reserved. See [LICENSE](./LICENSE).

## License Tools

License key generation, security rules, and technical license workflows are documented in [tools/license](./tools/license/README.md).
