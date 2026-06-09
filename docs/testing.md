# Testing

This page lists the checks used for Dream Invoice development, release candidates, and deployment verification.

## Full Quality Gate

Run the full local gate before important commits or release candidates:

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

Database migrations:

```bash
pnpm --filter @dream-invoice/database db:deploy
```

## Smoke Tests

Use HTTP smoke tests after starting the app:

```bash
curl -s -o /dev/null -w "%{http_code} /\n" http://127.0.0.1:3010/
curl -s -o /dev/null -w "%{http_code} /dashboard\n" http://127.0.0.1:3010/dashboard
curl -s -o /dev/null -w "%{http_code} /documents\n" http://127.0.0.1:3010/documents
curl -s -o /dev/null -w "%{http_code} /settings\n" http://127.0.0.1:3010/settings
```

Expected protected routes may redirect to login when no session exists.

## Workflow Tests

Use focused workflow tests for:

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
