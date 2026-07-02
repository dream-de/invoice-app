# Releasing

Use this guide when preparing a Dream Invoice release candidate.

## Release Quality Gate

Run:

```bash
pnpm release:quality
```

The release candidate should pass linting, type checks, tests, builds, release checks, and dependency audit.

## Release Steps

1. Confirm the working tree is clean.
2. Pull the latest repository changes.
3. Run `pnpm release:quality`.
4. Review README, docs, Docker files, and `.env.example`.
5. Confirm demo and landing-page stacks remain separate from the product stack.
6. Confirm database schema changes are included and Prisma client generation works.
7. Confirm GitHub Actions is green.
8. Create the tag or release only after checks are green.

## Documentation Review

Before a release, verify:

- Quick install instructions work
- Docker instructions match the current compose files
- Production deployment instructions match the current environment variables
- Security policy is current
- License text is unchanged unless intentionally updated
- Roadmap reflects the current product direction

## Deployment Smoke Check

After deployment:

```bash
docker compose ps
APP_URL="https://your-domain.example"
curl -s -o /dev/null -w "%{http_code} /\n" "$APP_URL/"
```

Then verify login, dashboard, documents, settings, and one PDF export.
