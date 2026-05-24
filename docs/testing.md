# Testing

Dream Invoice uses layered checks so small changes can be verified quickly while release candidates still run the complete quality gate.

## Main Quality Gate

Run the full release quality gate before important commits, release candidates, or public pushes:

```bash
pnpm release:quality
```

This runs linting, type checking, tests, builds, public release safety checks, and the security audit.

## Public Release Checks

Use this when changing demo data, landing-page content, README/docs, release files, or public repository metadata:

```bash
pnpm release:check
```

It verifies that public demo and landing assets do not contain real customer data, private keys, legacy names, or unsafe reference material.

## Security Audit

Run this after dependency changes:

```bash
pnpm security:audit
```

The command fails on moderate or higher known vulnerabilities reported by pnpm.

## Web App Checks

For changes limited to the main web app:

```bash
pnpm --filter @dream-invoice/web typecheck
pnpm --filter @dream-invoice/web lint
pnpm --filter @dream-invoice/web build
```

Use these during fast UI or API work, then run `pnpm release:quality` before pushing larger changes.

## Flow Smoke Tests

Dream Invoice keeps browser-level flow tests under `tests/flows`.

```bash
pnpm test:flows
```

Use flow tests for user-facing workflows such as dashboard navigation, document flows, imports, exports, and public demo behavior.

## Docker Development Checks

For local infrastructure:

```bash
pnpm docker:dev:up
pnpm docker:dev:ps
pnpm docker:dev:down
```

The development Docker stack is for local PostgreSQL, Mailpit, and Adminer only. It is not a production deployment.

## When to Run What

- Documentation-only change: `pnpm release:check`
- Dependency change: `pnpm security:audit` and `pnpm release:quality`
- Web UI/API change: web typecheck, lint, build
- Demo or landing change: `pnpm release:check`
- Release candidate: `pnpm release:quality`
- Before public push: confirm GitHub Actions passes

## Test Data Rules

- Use fictional customers, addresses, IBANs, emails, phone numbers, and invoice numbers.
- Do not use screenshots or PDFs from real customers.
- Keep demo and screenshot data separate from production data.
- Keep language strings in i18n namespace files when a namespace already exists.
