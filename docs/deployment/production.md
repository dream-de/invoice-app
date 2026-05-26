# Production Deployment

This guide describes a Docker-based Dream Invoice installation for a self-hosted server or LXC.

## 1. Environment

Create `.env` from `.env.example` and review every value before starting the stack.

Recommended secret generator:

```bash
openssl rand -base64 32
```

Important values:

- `AUTH_SECRET`
- `AUTH_COOKIE_SECURE` (use `true` for HTTPS deployments, `false` for local HTTP testing)
- `POSTGRES_PASSWORD`
- `DREAM_INVOICE_AUTH_PASSWORD`
- `DREAM_INVOICE_ADMIN_PASSWORD`
- `DATABASE_URL`
- `LICENSE_PUBLIC_KEY`
- SMTP settings, when email delivery is enabled

`LICENSE_PUBLIC_KEY` is the verification key used by the app. License signing keys stay in the license tooling environment.

## 2. Product Stack

Start the product stack from the repository root:

```bash
docker compose up -d
```

The stack starts:

- PostgreSQL
- Dream Invoice web app
- Nginx app proxy
- Optional worker profile, when enabled

Demo and landing-page services are handled by `docker/public-site.compose.yml` and are separate from the product installation.

## 3. Access

The product app supports deployment-level authentication through:

```env
DREAM_INVOICE_AUTH_USER=admin
DREAM_INVOICE_AUTH_PASSWORD=your-generated-password
DREAM_INVOICE_ADMIN_USER=admin
DREAM_INVOICE_ADMIN_PASSWORD=your-generated-admin-password
```

After first setup, app users and roles are managed inside Dream Invoice.

## 4. Reverse Proxy And TLS

Use a reverse proxy or hosting layer for HTTPS. The included Nginx container routes app traffic inside the Docker stack.

Typical setup:

```text
Internet -> HTTPS reverse proxy -> Docker Nginx -> Dream Invoice web app
```

Set the app URL in `.env` when the deployment uses a domain.

## 5. Network Binding

For a single-server install, bind PostgreSQL to localhost or leave it reachable only inside Docker. If the database is hosted elsewhere, use firewall rules or a restricted network between the app and database.

## 6. Database

Run migrations during deployment:

```bash
pnpm db:deploy
```

In Docker, migrations are applied through the app startup flow. Keep regular PostgreSQL backups and test restore steps before relying on them.

## 7. Worker

The worker processes scheduled jobs and background tasks. Start it only when the installation needs those jobs:

```bash
pnpm docker:worker
```

## 8. System Time

Keep the server clock synchronized with NTP. License expiry, audit timestamps, sessions, invoices, reminders, and email logs depend on correct time.

## 9. Checks

Before handover:

- `docker compose ps` shows healthy services
- The app opens through the configured URL
- Login and setup flow work
- Migrations are applied
- Backups are configured
- `.env` contains deployment-specific secrets
- `LICENSE_PUBLIC_KEY` is configured when license activation is used
