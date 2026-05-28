# Support

Support for Dream Invoice is currently best-effort.

## Where To Start

- Read the README for install and command overview
- Use `docs/deployment/production.md` for deployment setup
- Use `docs/operations/runbook.md` for operational checks
- Use `docs/testing.md` for local verification

## Useful Diagnostics

```bash
git status --short --branch
docker compose ps
docker compose logs --tail=200 web-app
docker compose logs --tail=200 nginx
docker compose logs --tail=200 postgres
pnpm release:quality
```

## Reporting Issues

When reporting a bug, include:

- What you expected
- What happened
- Steps to reproduce
- Relevant logs without credentials
- Browser and deployment type, if relevant

For security-sensitive findings, use the process in `SECURITY.md`.
