# Secrets Rotation

This guide explains how to rotate common Dream Invoice deployment secrets.

## Auth Secret

1. Generate a new value:

```bash
openssl rand -base64 32
```

2. Update `AUTH_SECRET` in `.env`.
3. Restart the app stack.
4. Existing sessions may need to sign in again.

## Deployment Passwords

Rotate these values when access changes:

- `DREAM_INVOICE_AUTH_PASSWORD`
- `DREAM_INVOICE_ADMIN_PASSWORD`
- `POSTGRES_PASSWORD`
- SMTP password

After changing `.env`, restart the stack:

```bash
docker compose up -d
```

## Database Password

When changing `POSTGRES_PASSWORD`, update both PostgreSQL and `DATABASE_URL`. Plan this during a maintenance window and verify the app can reconnect.

## License Keys

`LICENSE_PUBLIC_KEY` is the runtime verification key. License signing keys belong in the license tooling environment, not in source files.

When replacing a signing key:

1. Generate the new signing key pair in the license tooling environment.
2. Deploy the matching `LICENSE_PUBLIC_KEY`.
3. Issue new licenses with the matching signing key.
4. Keep the previous key available until existing licenses are migrated, if needed.

## After Rotation

- Check `docker compose ps`
- Verify login
- Verify license activation when licensing is used
- Verify email sending when SMTP changed
- Record the rotation date in operational notes
