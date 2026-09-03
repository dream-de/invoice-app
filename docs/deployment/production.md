# Production Deployment

This guide describes a Docker-based Dream Invoice installation for a self-hosted server or LXC.

## 1. Requirements

Install these tools on the server before starting:

- Git
- Docker Engine
- Docker Compose plugin
- OpenSSL, recommended for local secret generation

The normal product install pulls the published image:

```text
ghcr.io/dream-de/invoice-app:latest
```

Keep the package public when you want unauthenticated self-hosted installs from a public repository.

## 2. Fresh Install

Use the installer for a new LXC or server:

```bash
git clone <repository-url> dream-invoice
cd dream-invoice
chmod +x scripts/install.sh scripts/status.sh
./scripts/install.sh
```

The installer creates a local `.env` with generated secrets, pulls the product image, starts PostgreSQL, and starts the web app.

Open the configured application URL in a browser.

Create the first owner account in the browser. After that, the initial setup route closes automatically.

## 3. Manual Environment

For a manual install, create `.env` from `.env.example` and review every value before starting the stack:

```bash
cp .env.example .env
nano .env
```

Recommended secret generator:

```bash
openssl rand -hex 32
```

Important values:

- `AUTH_SECRET`
- `AUTH_COOKIE_SECURE` (use `true` for HTTPS deployments, `false` for local HTTP testing)
- `POSTGRES_PASSWORD`
- `DREAM_INVOICE_AUTH_REQUIRED`
- `DREAM_INVOICE_AUTH_PASSWORD`
- `DREAM_INVOICE_ADMIN_PASSWORD`
- `DREAM_INVOICE_LOGIN_WINDOW_MS`
- `DREAM_INVOICE_LOGIN_MAX_ATTEMPTS`
- `LICENSE_PUBLIC_KEY`
- SMTP settings, when email delivery is enabled

`LICENSE_PUBLIC_KEY` is the verification key used by the app. License signing keys stay in the license tooling environment.

## 4. Product Stack

Start the product stack from the repository root:

```bash
docker compose pull
docker compose up -d
```

The default stack starts:

- PostgreSQL
- Dream Invoice web app

The included Nginx service is optional and only starts with the `proxy` profile:

```bash
docker compose --profile proxy up -d nginx
```

Use the optional proxy only when it fits your hosting layout. Many production setups terminate TLS at an external reverse proxy instead.

## 5. Access And First Login

For the first local HTTP start, deployment Basic Auth can stay disabled:

```env
DREAM_INVOICE_AUTH_REQUIRED=false
AUTH_COOKIE_SECURE=false
```

Before exposing the app publicly, enable deployment protection and HTTPS cookies:

```env
DREAM_INVOICE_AUTH_REQUIRED=true
AUTH_COOKIE_SECURE=true
```

Use `AUTH_COOKIE_SECURE=true` only when the public app URL uses HTTPS.

After first setup, app users and roles are managed inside Dream Invoice.

## 6. Reverse Proxy And TLS

Use a reverse proxy or hosting layer for HTTPS.

Typical setup:

```text
Internet -> HTTPS reverse proxy -> Dream Invoice web app
```

When using the optional Docker Nginx profile:

```text
Internet -> HTTPS reverse proxy -> Docker Nginx -> Dream Invoice web app
```

Set the public app URL in `.env` when the deployment uses a domain.

## 7. Network Binding

For a single-server install, keep PostgreSQL reachable only from the intended private network or Docker network. If the database is hosted elsewhere, use firewall rules or a restricted network between the app and database.

## 8. Database And Backups

In Docker, database schema updates are applied through the app startup flow. Keep regular PostgreSQL archives and test restore steps before relying on them.

Example backup:

```bash
docker compose exec -T postgres pg_dump -U dream_invoice dream_invoice > dream-invoice-backup.sql
```

Store backups outside the application directory and protect them like production data.

## 9. Updates

Before updating a real installation:

1. Create a database backup.
2. Keep the current `.env` private.
3. Pull the latest repository changes.
4. Pull the latest product image.
5. Restart the stack.

```bash
git pull
docker compose pull
docker compose up -d
./scripts/status.sh
```

Maintainers testing local source changes can build the product image instead:

```bash
docker compose -f docker-compose.yml -f docker-compose.build.yml up -d --build web-app
```

## 10. System Time

Keep the server clock synchronized with NTP. License expiry, audit event times, sessions, invoices, reminders, and email logs depend on correct time.

## 11. Handover Checks

Before handover:

- `docker compose ps` shows healthy services
- The app opens through the configured URL
- Initial owner setup works
- Login and logout work
- Protected routes require a valid session
- Invoice PDF generation works
- Export endpoints respond
- Backups are configured
- Restore was tested
- `.env` contains deployment-specific secrets
- `LICENSE_PUBLIC_KEY` is configured when license activation is used
