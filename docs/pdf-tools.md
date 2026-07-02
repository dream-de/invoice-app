# PDF Tools

Dream Invoice renders invoice PDFs from app data and document templates. The current production path uses Puppeteer inside the web app.

## Current Flow

```text
Invoice data -> Template -> HTML -> Puppeteer -> PDF response
```

Important files:

- `apps/web/src/app/api/invoice/pdf/[id]/route.ts`
- `apps/web/src/lib/pdf/layout.ts`
- `apps/web/src/lib/pdf/invoice-totals.ts`
- `packages/pdf/src/models/pdf-invoice.ts`

## Checks

Run PDF-related tests with:

```bash
pnpm --filter @dream-invoice/web test
pnpm --filter @dream-invoice/pdf test
```

## Optional Tools

Additional PDF tooling can be added when it supports a product workflow, such as visual regression tests, PDF/A validation, or template compatibility checks. Keep extra tooling optional unless the workflow depends on it.
