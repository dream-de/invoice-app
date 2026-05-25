# Secrets Rotation

Secrets must be replaceable without changing source code. Production secrets should live in deployment configuration, not in the repository.

## Generate Strong Secrets

```bash
openssl rand -base64 32
```

Use different values for different purposes.

## Rotate AUTH_SECRET

1. Generate a new value.
2. Update the production environment variable.
3. Restart the web app.
4. Confirm login/session-sensitive flows still work as expected.

Changing `AUTH_SECRET` may invalidate existing sessions depending on the auth implementation.

## Rotate PostgreSQL Password

1. Put the app into maintenance mode if needed.
2. Generate a new password.
3. Change the database user password.
4. Update `POSTGRES_PASSWORD` and `DATABASE_URL`.
5. Restart app services.
6. Confirm migrations and a basic app request succeed.

## Rotate License Keys

- Private signing keys must stay outside the repository.
- Public verification keys may be deployed through `LICENSE_PUBLIC_KEY`.
- When replacing a signing key, deploy the matching public key before issuing newly signed licenses.
- Keep an operational record of when a key was introduced and retired.

## Keep Out of the Repository

- Production `.env` files
- Private license keys
- Customer license keys
- Database dumps
- Real customer invoices or screenshots
- Real SMTP or payment credentials
