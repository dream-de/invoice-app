# Releasing Dream Invoice

Dream Invoice is still in a public foundation phase. A release should only be published when the repository is clean, the quality gates are green, and no private data or legacy reference names are present.

## Release Checklist

1. Pull the latest `main` branch.
2. Run the full local quality gate:

```bash
pnpm release:quality
```

3. Confirm the repository is clean:

```bash
git status --short --branch
```

4. Check GitHub Actions for a green CI run.
5. Review `CHANGELOG.md` and update release notes.
6. Tag only after the app, demo, landing page, Docker stack, and public release checks are green.

## Public Release Rules

- Do not publish real customer, supplier, payment, IBAN, email, or phone data.
- Do not publish private license keys or production environment files.
- Keep demo data fictional.
- Keep old product names and external reference-template names out of tracked source files.
- Prefer small release commits over large mixed commits.

## Recommended Commands

```bash
pnpm release:check
pnpm security:audit
pnpm release:quality
```
