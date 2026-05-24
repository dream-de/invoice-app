# Dream Invoice Development Docker

This folder contains local development helpers for Dream Invoice. It is not the production deployment stack.

## Services

- PostgreSQL for local database testing
- Mailpit for safe email testing without sending real emails
- Adminer for quick database inspection

## Start

```bash
pnpm docker:dev:up
```

## Stop

```bash
pnpm docker:dev:down
```

## Status and Logs

```bash
pnpm docker:dev:ps
pnpm docker:dev:logs
```

## Local URLs

- Mailpit inbox: http://localhost:8025
- Adminer: http://localhost:8081
- PostgreSQL host port: 55433

## Database Connection

Use these values in Adminer:

- System: PostgreSQL
- Server: postgres
- Username: dream_invoice
- Password: dream_invoice_dev_password
- Database: dream_invoice

From the host machine, use:

```text
postgresql://dream_invoice:dream_invoice_dev_password@127.0.0.1:55433/dream_invoice
```

## Email Testing

Use Mailpit SMTP from the host machine:

```text
SMTP_HOST=127.0.0.1
SMTP_PORT=1025
SMTP_SECURE=false
```

Emails are captured by Mailpit and can be reviewed in the browser. No real customer emails are sent.

## Notes

Dream Invoice currently supports PostgreSQL for the official development database. MySQL, SQLite, and Gotenberg compose variants are intentionally not part of this setup until they are tested and supported.
