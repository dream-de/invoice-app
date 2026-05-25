# Contributing to Dream Invoice

Thank you for helping improve Dream Invoice. This repository is still in a public foundation phase, so contributions should stay focused, well-scoped, and safe for a financial workflow product.

## Development Setup

```bash
pnpm install
pnpm db:generate
pnpm dev:web
```

For local infrastructure helpers, use:

```bash
pnpm docker:dev:up
pnpm docker:dev:ps
pnpm docker:dev:down
```

## Before Opening a Pull Request

Run the smallest relevant checks for your change. For broad changes, run:

```bash
pnpm release:quality
```

For web-only changes, run at least:

```bash
pnpm --filter @dream-invoice/web typecheck
pnpm --filter @dream-invoice/web lint
```

## Data and Security Rules

- Do not commit real customer, supplier, bank, IBAN, email, phone, invoice, or payment data.
- Do not commit production `.env` files, private license keys, database dumps, or generated build output.
- Use fictional demo data only.
- Keep product naming consistent: Dream Invoice.
- Keep UI text in the i18n namespace files when a namespace already exists.

## Pull Request Style

- Keep PRs small and focused.
- Explain what changed and how it was tested.
- Include screenshots for visible UI changes.
- Prefer existing app patterns over new abstractions.


## Community Standards

Please follow the [Code of Conduct](./CODE_OF_CONDUCT.md) and use [Support](./SUPPORT.md) for help requests.
