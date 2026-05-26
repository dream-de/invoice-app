# Contributing

Thank you for helping improve Dream Invoice. Contributions should stay focused, well-scoped, and aligned with invoicing, finance, documents, licensing, deployment, or developer quality.

## Workflow

1. Open an issue or describe the change before large work.
2. Keep pull requests focused on one topic.
3. Add or update tests when behavior changes.
4. Update documentation when setup, commands, or user-facing behavior changes.
5. Run the relevant checks before submitting.

## Local Checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

For release-level confidence:

```bash
pnpm release:quality
```

## Data Rules

Use fictional sample data in examples, tests, screenshots, and fixtures. Source control should not include deployment `.env` files, database dumps, credentials, license signing keys, or generated build output.

## Style

- Prefer existing project patterns
- Keep changes small and readable
- Use shared packages for reusable business logic
- Keep UI copy clear and direct
- Keep documentation accurate to the current code
