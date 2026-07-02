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

## Local Services

The development stack exposes database, email, and admin helper services using values from `docker/development/.env.example`. Adjust those values when you need custom ports or credentials.

## Database Connection

Use these values in Adminer:

- System: PostgreSQL
- Server: postgres
- Username: dream_invoice
- Password: dream_invoice_dev_password
- Database: dream_invoice

## Email Testing

Mailpit captures development emails so no real customer emails are sent.

## Notes

Dream Invoice currently supports PostgreSQL for the official development database. MySQL, SQLite, and Gotenberg compose variants are not part of the supported development stack.
