# Production Deployment

Dream Invoice can run behind Docker and a reverse proxy. The repository includes a production-style Compose stack, but a real production deployment still needs secure secrets, HTTPS, backups, and operational monitoring.

## Required Production Secrets

Never use development defaults in production. Generate strong values with:

```bash
openssl rand -base64 32
```

Set at least:

```env
AUTH_SECRET=<generated-secret>
POSTGRES_PASSWORD=<generated-secret>
POSTGRES_USER=dream_invoice
POSTGRES_DB=dream_invoice
DATABASE_URL=postgresql://dream_invoice:<generated-secret>@postgres:5432/dream_invoice
```

Keep production `.env` files outside Git.

## Deployment Authentication

Dream Invoice is designed for self-hosted installations, but any instance exposed beyond a trusted local network should have an access gate. The web app supports deployment-level Basic Auth through environment variables:

```env
DREAM_INVOICE_AUTH_USER=admin
DREAM_INVOICE_AUTH_PASSWORD=<generated-secret>
DREAM_INVOICE_AUTH_REQUIRED=true
```

When enabled, the browser UI and API routes require the configured credentials. Mutating API requests also have a Same-Origin guard by default, which blocks cross-site write attempts before they reach individual route handlers.

The admin foundation is stricter: in production it fails closed unless an admin password is configured. Do not expose `apps/admin` publicly without:

```env
DREAM_INVOICE_ADMIN_USER=admin
DREAM_INVOICE_ADMIN_PASSWORD=<generated-secret>
DREAM_INVOICE_ADMIN_AUTH_REQUIRED=true
```

## HTTPS and Reverse Proxy

Production traffic must use HTTPS. Recommended options:

- Nginx Proxy Manager
- Caddy
- Traefik
- Cloudflare Tunnel or Cloudflare reverse proxy
- A managed platform with TLS termination

Use HTTP-to-HTTPS redirects and enable HSTS only after the HTTPS setup is verified.

## Public Exposure

The default product Compose stack is intentionally limited to the customer application:

- `apps/web`: main application
- PostgreSQL
- Nginx app proxy
- `apps/server-worker`: optional private worker profile

The product Docker image removes `apps/demo` and `apps/landing-page` after the web build so those public-only apps are not packaged into the runtime container.

The public demo and marketing page are separate from a customer/LXC installation. Deploy them only when intentionally hosting the public website stack:

- `apps/demo`: public demo, via `docker/public-site.compose.yml`
- `apps/landing-page`: public product page, via `docker/public-site.compose.yml`

Keep internal foundations private unless deliberately deployed:

- `apps/admin`
- `apps/accounting`
- `apps/server-api`
- `apps/server-worker`
- `apps/desktop`
- `apps/pro-desktop`

The worker should run as a scheduled or profile-based background process, not as a public HTTP service.

## Database Backups

Create backups regularly:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore only into an environment where the target database is intended to be replaced:

```bash
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U dream_invoice dream_invoice
```

## Production Checklist

Use the detailed [Production Checklist](./production-checklist.md) before exposing Dream Invoice to public traffic.

Minimum launch gates:

- [ ] Replace all development passwords and secrets
- [ ] Configure deployment authentication for any public or shared-network instance
- [ ] Configure HTTPS and HTTP-to-HTTPS redirects
- [ ] Confirm `DATABASE_URL` points to the intended production database
- [ ] Run `pnpm release:quality`
- [ ] Confirm GitHub Actions is green
- [ ] Configure and test backups
- [ ] Verify no internal-only apps are publicly exposed
- [ ] Verify customer/LXC installs do not start `demo-app` or `landing-page`
- [ ] If the public website stack is enabled, verify `dream-invoice.com` and `demo.dream-invoice.com` route to the intended services
