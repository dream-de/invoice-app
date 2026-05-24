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

## HTTPS and Reverse Proxy

Production traffic must use HTTPS. Recommended options:

- Nginx Proxy Manager
- Caddy
- Traefik
- Cloudflare Tunnel or Cloudflare reverse proxy
- A managed platform with TLS termination

Use HTTP-to-HTTPS redirects and enable HSTS only after the HTTPS setup is verified.

## Public Exposure

Expose only the services needed by users:

- `apps/web`: main application
- `apps/demo`: public demo, if enabled
- `apps/landing-page`: public product page, if enabled

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

- [ ] Replace all development passwords and secrets
- [ ] Configure HTTPS and redirects
- [ ] Confirm `DATABASE_URL` points to the intended database
- [ ] Run `pnpm release:quality`
- [ ] Confirm GitHub Actions is green
- [ ] Configure backups
- [ ] Verify no internal-only apps are publicly exposed
