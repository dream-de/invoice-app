# Production Checklist

Use this checklist before exposing Dream Invoice to public traffic. It is intentionally deployment-provider neutral and assumes a Docker-based deployment behind a reverse proxy.

## 1. Domain And DNS

Recommended public domains:

- `dream-invoice.com` for the landing page
- `www.dream-invoice.com` for the landing page
- `demo.dream-invoice.com` for the public demo
- `app.dream-invoice.com` for the main web app

Before launch:

- [ ] Point the required DNS records to the production server or reverse proxy
- [ ] Keep DNS TTL low during the first deployment window
- [ ] Verify each hostname resolves to the intended target
- [ ] Decide whether `www.dream-invoice.com` redirects to `dream-invoice.com`

## 2. Secrets And Environment

Never use development defaults in production.

Generate secrets:

```bash
openssl rand -base64 32
```

Required checks:

- [ ] Set a strong `AUTH_SECRET`
- [ ] Set a strong `POSTGRES_PASSWORD`
- [ ] Keep production `.env` files outside Git
- [ ] Verify `DATABASE_URL` matches the production database
- [ ] Verify `LICENSE_PUBLIC_KEY` is the public verification key only
- [ ] Confirm private license signing keys are never deployed to customer/runtime systems

## 3. HTTPS And Reverse Proxy

The included Nginx config is an internal HTTP router. Public TLS should be handled by a dedicated reverse proxy or hosting layer.

Recommended options:

- Nginx Proxy Manager
- Caddy
- Traefik
- Cloudflare proxy or Cloudflare Tunnel
- Managed platform TLS termination

Before launch:

- [ ] Enable HTTPS for every public hostname
- [ ] Redirect HTTP to HTTPS
- [ ] Verify certificate renewal
- [ ] Enable HSTS only after HTTPS is stable
- [ ] Forward `X-Forwarded-Proto`, `X-Forwarded-For`, and `Host` headers correctly

## 4. Public Exposure

Public:

- [ ] Landing page
- [ ] Demo app, if enabled
- [ ] Main web app

Private/internal:

- [ ] Admin app
- [ ] Accounting app
- [ ] Server API foundation
- [ ] Server worker
- [ ] Desktop/pro desktop foundations
- [ ] PostgreSQL

Do not expose PostgreSQL, server worker, or internal foundations directly to the internet.

## 5. Database And Backups

Before launch:

- [ ] Run migrations against the intended production database
- [ ] Create an initial backup
- [ ] Test restore in a non-production environment
- [ ] Document backup retention
- [ ] Store backups outside the application server when possible

Backup command:

```bash
docker compose exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore command:

```bash
cat backup.sql | docker compose exec -T postgres psql -U dream_invoice dream_invoice
```

## 6. Worker Strategy

The worker should run as a background process, not as a public HTTP service.

- [ ] Decide whether the worker runs by Docker profile, cron, systemd, or another scheduler
- [ ] Verify `SERVER_WORKER_MODE`
- [ ] Verify `SERVER_WORKER_SCHEDULE_FILE`
- [ ] Verify `SERVER_WORKER_LIMIT`
- [ ] Run the worker smoke test before enabling recurring execution

## 7. Quality Gates

Run before deployment:

```bash
pnpm release:quality
pnpm security:audit
git status --short --branch
```

Verify on GitHub:

- [ ] CI is green
- [ ] Dependabot alerts are reviewed
- [ ] Branch protection is configured when the repository is public or team-managed
- [ ] No production secrets are present in commits, issues, screenshots, or logs

## 8. Post-Deployment Smoke Test

After deployment:

- [ ] Open the landing page
- [ ] Open the demo app
- [ ] Open the main app
- [ ] Open the dashboard
- [ ] Create or edit a test document
- [ ] Generate a PDF
- [ ] Open settings pages
- [ ] Check container health checks
- [ ] Review logs for errors

## 9. Rollback Readiness

Before launch:

- [ ] Know the last stable Git commit or container image
- [ ] Have a fresh database backup
- [ ] Keep migration rollback risk documented
- [ ] Prefer forward-fix migrations unless restoring a backup is clearly safer

## 10. Launch Decision

Launch only when:

- [ ] HTTPS works
- [ ] Production secrets are set
- [ ] Backups exist
- [ ] CI is green
- [ ] Public apps work
- [ ] Internal services remain private
- [ ] Logs are clean after smoke testing
