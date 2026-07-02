# Testing

This page lists public verification checks for Dream Invoice development, release candidates, and deployment reviews.

## Full Quality Gate

Run the full local gate before important changes or release candidates:

```bash
pnpm release:quality
```

This runs linting, type checking, tests, builds, release checks, and the dependency audit.

## Release Checks

Run this after changing demo content, landing-page content, README, docs, release files, or repository metadata:

```bash
pnpm release:check
```

## Package Checks

Run targeted checks while working on a package or app:

```bash
pnpm --filter @dream-invoice/web lint
pnpm --filter @dream-invoice/web typecheck
pnpm --filter @dream-invoice/web test
pnpm --filter @dream-invoice/web build
```

Database client generation:

```bash
pnpm --filter @dream-invoice/database db:generate
```

Database schema deployment:

```bash
pnpm --filter @dream-invoice/database db:deploy
```

## Smoke Checks

Use the configured application URL for deployment checks:

```bash
APP_URL="https://your-domain.example"
curl -s -o /dev/null -w "%{http_code} /\n" "$APP_URL/"
curl -s -o /dev/null -w "%{http_code} /dashboard\n" "$APP_URL/dashboard"
curl -s -o /dev/null -w "%{http_code} /documents\n" "$APP_URL/documents"
curl -s -o /dev/null -w "%{http_code} /settings\n" "$APP_URL/settings"
```

Protected routes may redirect to login when no session exists.

## Workflow Checks

Use focused workflow checks for:

- Login and logout
- First owner setup
- Customer creation
- Article creation
- Document creation and PDF export
- Import and export endpoints
- Settings pages
- License activation
- User limit enforcement

## Test Data

Use fictional data in examples, fixtures, screenshots, PDFs, and demo flows. Keep generated artifacts out of source control unless they are intentional fixtures.
