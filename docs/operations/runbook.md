# Operations Runbook

This runbook lists practical steps for common Dream Invoice operational tasks in Docker-based installations.

## Check Stack Health

```bash
docker compose ps
docker compose logs --tail=200 web-app
docker compose logs --tail=200 postgres
```

Expected:

- PostgreSQL is healthy
- Web app is healthy
- App URL responds with HTTP 200 or redirects to login
- Optional Nginx proxy is healthy only when the proxy profile is enabled

## Restart The Product Stack

```bash
docker compose restart web-app postgres
```

When the optional Docker Nginx proxy is enabled:

```bash
docker compose --profile proxy restart nginx
```

Restart one service:

```bash
docker compose restart web-app
```

## Update Deployment

```bash
git pull
pnpm db:deploy
docker compose build
docker compose up -d
```

Then run:

```bash
docker compose ps
```

## Database Backup

Example backup command:

```bash
docker compose exec postgres pg_dump -U dream_invoice dream_invoice > dream-invoice-backup.sql
```

Store backups outside the container volume and test restore steps regularly.

## Database Restore

Stop the app services, restore into PostgreSQL, then start the stack again.

```bash
docker compose stop web-app
docker compose exec -T postgres psql -U dream_invoice dream_invoice < dream-invoice-backup.sql
docker compose up -d
```

If the optional Docker Nginx proxy is enabled, restart it after the app is healthy:

```bash
docker compose --profile proxy up -d nginx
```

## Migrations

Apply migrations:

```bash
pnpm db:deploy
```

Check migration status:

```bash
pnpm --filter @dream-invoice/database prisma migrate status --schema ./prisma/schema.prisma
```


## Email

For email issues:

- Verify SMTP host, port, username, password, and sender address in `.env`
- Test the email settings route in the app
- Check app logs for SMTP connection errors
- Confirm the mail provider accepts the configured sender

## License

For license activation issues:

- Confirm `LICENSE_PUBLIC_KEY` is configured
- Confirm server time is synchronized
- Verify the license key belongs to the current signing key
- Check user count against the license limit
- Review app logs around activation time

## Incident Notes

For operational incidents, record:

- Time of detection
- Affected service
- User-visible impact
- Commands run
- Backup or restore actions
- Follow-up item
