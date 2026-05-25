# Operations Runbook

This runbook lists practical steps for common Dream Invoice operational incidents. It assumes a Docker-based product deployment using `docker/docker-compose.yml`. The public demo and landing page use `docker/public-site.compose.yml` only when intentionally hosted.

## First Checks

Run these commands before changing anything:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs --tail=200
pnpm release:check
pnpm security:audit
```

Check Git state:

```bash
git status --short --branch
git log --oneline -5
```

## Web App Is Down

Symptoms:

- Browser shows a 502, timeout, or blank response
- Nginx is running but the web app is unhealthy

Checks:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml logs --tail=200 web-app
docker compose -f docker/docker-compose.yml logs --tail=200 nginx
```

Recovery:

```bash
docker compose -f docker/docker-compose.yml restart web-app
docker compose -f docker/docker-compose.yml ps
```

If the app still fails, verify environment variables and database connectivity before rebuilding.

## Database Is Unhealthy

Symptoms:

- PostgreSQL health check fails
- Prisma cannot connect
- Login, settings, or document pages return server errors

Checks:

```bash
docker compose -f docker/docker-compose.yml ps postgres
docker compose -f docker/docker-compose.yml logs --tail=200 postgres
docker compose -f docker/docker-compose.yml exec postgres pg_isready -U dream_invoice -d dream_invoice
```

Recovery:

- Confirm that `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, and `DATABASE_URL` are consistent.
- Confirm the database volume exists and was not replaced accidentally.
- Restore from backup if the data volume is damaged.

## Migration Fails

Symptoms:

- The app starts but exits during `db:deploy`
- Logs mention Prisma migration errors

Checks:

```bash
docker compose -f docker/docker-compose.yml logs --tail=300 web-app
pnpm --filter @dream-invoice/database db:deploy
```

Recovery:

- Do not delete migration files.
- Do not edit an already-applied migration in production.
- Take a database backup before retrying.
- If a migration partially applied, inspect the Prisma migration table and restore from backup when needed.

## Worker Job Fails

Symptoms:

- Scheduled jobs do not run
- Worker exits with an error

Checks:

```bash
docker compose -f docker/docker-compose.yml --profile worker ps
docker compose -f docker/docker-compose.yml --profile worker logs --tail=200 server-worker
pnpm worker:server:smoke
```

Recovery:

- Verify `SERVER_WORKER_MODE`, `SERVER_WORKER_SCHEDULE_FILE`, and `SERVER_WORKER_LIMIT`.
- Run the worker manually once before enabling scheduled execution.
- Keep the worker private; it should not be exposed as a public HTTP service.

## Rollback Procedure

Use this when a deployment causes a regression.

1. Stop write-heavy operations if possible.
2. Create a fresh database backup.
3. Revert the application image or Git commit.
4. Restart the affected services.
5. Verify health checks, login, dashboard, document editing, and export flows.

Suggested commands:

```bash
docker compose -f docker/docker-compose.yml ps
docker compose -f docker/docker-compose.yml restart web-app nginx
docker compose -f docker/docker-compose.yml logs --tail=200 web-app
```

Database rollbacks require extra care. Prefer forward-fix migrations unless a backup restore is clearly safer.

## Backup And Restore

Create a backup:

```bash
docker compose -f docker/docker-compose.yml exec postgres pg_dump -U dream_invoice dream_invoice > backup.sql
```

Restore a backup:

```bash
cat backup.sql | docker compose -f docker/docker-compose.yml exec -T postgres psql -U dream_invoice dream_invoice
```

After restore:

```bash
docker compose -f docker/docker-compose.yml restart web-app
docker compose -f docker/docker-compose.yml ps
```

## Security Incident

Examples:

- A secret was committed
- A production `.env` file leaked
- A license signing key was exposed
- Suspicious admin or database activity was detected

Immediate actions:

1. Rotate the affected secret.
2. Revoke or replace affected credentials.
3. Check Git history and remove exposed data where possible.
4. Review application logs, database access, and recent deployments.
5. Document the incident, impact, and recovery steps.

See also:

- [Secrets Rotation](../security/secrets-rotation.md)
- [Production Deployment](../deployment/production.md)

## Release Checklist

Before a release:

```bash
pnpm release:quality
git status --short --branch
```

After deployment:

- Confirm health checks are green.
- Open the dashboard.
- Create or edit a test document.
- Verify PDF generation.
- Verify settings pages.
- Review logs for errors.
