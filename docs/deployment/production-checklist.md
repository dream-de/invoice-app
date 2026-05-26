# Production Checklist

Use this checklist before handing over a Dream Invoice installation.

## 1. Environment

- [ ] `.env` was created from `.env.example`
- [ ] `AUTH_SECRET` was changed
- [ ] `POSTGRES_PASSWORD` was changed
- [ ] `DREAM_INVOICE_AUTH_PASSWORD` was changed
- [ ] `DREAM_INVOICE_ADMIN_PASSWORD` was changed
- [ ] `DATABASE_URL` points to the intended database
- [ ] `LICENSE_PUBLIC_KEY` is configured when licensing is used
- [ ] SMTP settings are configured when email sending is enabled

## 2. Docker Stack

- [ ] `docker compose up -d` starts successfully
- [ ] `docker compose ps` shows healthy services
- [ ] App proxy reaches the web app
- [ ] PostgreSQL volume is persistent
- [ ] Optional worker profile is enabled only when needed

## 3. Network And TLS

- [ ] HTTPS is configured at the reverse proxy or hosting layer
- [ ] App URL points to the intended domain or host
- [ ] PostgreSQL is reachable only from the intended network
- [ ] Firewall rules match the deployment plan

## 4. App Setup

- [ ] First owner account was created
- [ ] Setup route is closed after owner creation
- [ ] Login works
- [ ] Logout works
- [ ] Protected app routes require a valid session
- [ ] Mutating API routes use the request guard

## 5. Data And Backups

- [ ] Database migrations are applied
- [ ] Backup schedule exists
- [ ] Restore procedure was tested
- [ ] Upload and export directories are included where relevant
- [ ] Log retention is defined

## 6. License

- [ ] License activation succeeds with a valid license key
- [ ] Invalid license keys are rejected
- [ ] User limits are displayed correctly
- [ ] User creation respects the active license limit
- [ ] Server time is synchronized

## 7. Final Smoke Test

- [ ] Dashboard opens
- [ ] Customer list opens
- [ ] Customer creation opens
- [ ] Article list opens
- [ ] Document list opens
- [ ] Document PDF route works
- [ ] Settings pages open
- [ ] Finance overview opens
- [ ] Import template endpoints respond
- [ ] Export endpoints respond
