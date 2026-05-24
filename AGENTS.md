# Dream Invoice Agent Guide

This repository is a pnpm/Turbo monorepo for Dream Invoice.

## Core Rules

- Use pnpm commands, not npm or yarn.
- Keep the workspace structure stable: apps, packages, assets, docker, docs, tests, tools.
- Do not commit real customer data, production secrets, private license keys, local email logs, or generated build output.
- Use fictional demo data only. Public demos and screenshots must never contain real names, IBANs, emails, phone numbers, or customer records.
- Keep product naming consistent: Dream Invoice.
- Do not introduce old project names or third-party product names into source code unless they are used in attribution, documentation, or external references.

## Before Committing

Run the smallest relevant checks for the changed area. For broad changes, run:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

For web-only UI changes, at minimum run:

```bash
pnpm --filter @dream-invoice/web typecheck
pnpm --filter @dream-invoice/web lint
```

For Docker changes, validate the compose file:

```bash
docker compose -f docker/docker-compose.yml config
docker compose -f docker/development/docker-compose.yml config
```

## Development Docker

Use `docker/development` for local-only helpers such as PostgreSQL, Mailpit, and Adminer. Do not mix local development helpers into the production compose file unless they are explicitly required there.

## Internationalization

Prefer the namespace files in `apps/web/src/i18n/locales`. Avoid adding new hard-coded interface text when a namespace key already fits.

## File Editing

Keep changes scoped to the request. Do not rewrite unrelated files, generated files, lockfiles, or package manifests unless the task requires it.
