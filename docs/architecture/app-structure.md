# App Structure

This repository is a product monorepo. The current structure stays stable first; new apps or packages are added only when they contain real code and have a clear runtime purpose.

## Current Structure

```txt
apps/
  invoice/      Main web application for invoices, documents, templates, finance, settings, and dashboard.
  demo/         Reserved demo workspace scaffold; no public demo runtime yet.
  landing-page/ Reserved marketing-site workspace scaffold; no public landing runtime yet.
  desktop/     Reserved desktop workspace scaffold; runtime technology is not selected yet.
  server-worker/ Reserved background-worker workspace for PDF, email, import, and scheduled jobs.
  server/       Existing server/API workspace.
  admin/        Existing admin workspace.
  accounting/   Existing accounting workspace.

packages/
  ui/           Shared UI package.
  ocr/          Import/OCR helpers.
  invoice-core/ Invoice domain rules and status helpers.
  pdf/          PDF data contracts, metadata helpers, and renderer-neutral PDF utilities.

database/       Prisma schema, migrations, and seed data.
docker/         Deployment/runtime containers.
docs/           Product and architecture documentation.
tools/license/ License tooling.
```

## Target Direction

The long-term direction is inspired by mature product monorepos, but the repository should not collect empty placeholder apps.

Potential future apps:

```txt
apps/
  invoice-pro/   Pro edition only if product separation becomes necessary.
```

Potential future packages:

```txt
packages/
  invoice-core/    Invoice rules, totals, taxes, statuses, number ranges.
  pdf-engine/      PDF and document-template rendering.
  import-export/   CSV, bank, article, customer, and document import/export helpers.
  i18n/            Shared translation dictionaries and helpers if they outgrow the invoice app.
  email/           Shared email rendering, delivery, and logging helpers.
```

## Rules

1. Keep `apps/web` as the main web app until there is a real reason to rename or split it.
2. Do not move working code only to make the repository look bigger.
3. Add a new app only when it has a separate runtime, build target, or deployment target.
4. Add a new package only when at least two apps or modules need to share the same logic.
5. Keep product logic out of UI components when it becomes reusable.
6. Keep server workers separate from user-facing web routes once tasks become slow, scheduled, or queue-based.
7. Keep demo data separate from production data before creating a public demo app.
8. Keep one root `README.md`; deeper docs belong under `docs/`.

## Comparison Notes

A mature app can use separate workspaces such as `web`, `web-pro`, `desktop`, `server-api`, and `server-worker`. That structure is useful when those targets are real products. For this repository, the professional path is incremental: stabilize the current app, then split only the parts that earn their own workspace.

## Next Candidates

The safest next structural extraction candidates are:

1. `packages/invoice-core` for invoice calculation and document status rules.
2. `packages/pdf-engine` for template rendering and PDF output.
3. Build out `apps/server-worker` for asynchronous PDF, email, and import jobs.
4. Build out `apps/demo` once the public demo mode is designed.
5. Build out `apps/landing-page` once the public website content is designed.
6. Build `apps/desktop` later with Electron, after the web app is stable.

## Package Boundaries

### packages/invoice-core

The invoice core package owns reusable invoice domain logic that should work without React, Next.js, Prisma request handlers, or browser APIs. It is safe to use from the web app, API modules, demo app, worker app, and future desktop app.

Belongs here:

1. Invoice and item domain types.
2. Totals, tax calculation wrappers, and rounding rules.
3. Invoice status normalization and status guards.
4. Validation rules that are independent from UI wording.
5. Number-range rules once they are shared by more than one app/runtime.

Does not belong here:

1. React components or Tailwind classes.
2. Next.js route handlers or server actions.
3. Prisma queries or database connection code.
4. Browser-only download, print, or Blob logic.
5. Product copy, translations, and page layout.


### packages/pdf

The PDF package owns renderer-neutral PDF helpers and contracts. It should stay usable from the web app, worker app, demo app, and future desktop app without importing React, Next.js route handlers, Prisma, or browser-only download APIs.

Belongs here:

1. PDF invoice data contracts.
2. Safe PDF file-name helpers.
3. Content-Disposition and PDF metadata helpers.
4. Currency formatting helpers that are independent from page layout.
5. Validation rules for PDF DTOs before rendering.

Does not belong here:

1. Puppeteer, Playwright, or browser process launch code.
2. Next.js API route handlers.
3. Prisma queries or database connection code.
4. Template editor React components.
5. Browser Blob downloads, toast messages, or navigation logic.

## Domain Mapping

The planned public domain structure is documented in `docs/architecture/domains.md`. The short version is:

```txt
dream-invoice.com       -> apps/landing-page
demo.dream-invoice.com  -> apps/demo
app.dream-invoice.com   -> apps/web
api.dream-invoice.com   -> apps/server, when separated
server-worker           -> internal only
```

These domains are not hard-coded yet. They should be connected through deployment and environment configuration when the public infrastructure is ready.


### apps/server-worker

The server-worker workspace is reserved for background jobs that should not block user-facing web requests. It starts with runtime-neutral contracts and lightweight helpers, then can grow into a real worker process when queues, schedules, or external delivery are introduced.

Belongs here:

1. PDF render job contracts and queue payloads.
2. Email delivery job contracts, recipients, attachment references, and provider-neutral results.
3. Import processing job contracts for articles, customers, recipients, bank data, and receipts.
4. Scheduled job contracts for recurring invoices, payment reminders, dunning runs, and maintenance.
5. Worker-only orchestration once a queue runtime exists.
6. Provider-neutral retry metadata once delivery needs retries.
7. File-reference payloads for imports before parsing starts.
8. Time-window payloads for scheduled jobs, including timezone and dry-run support.
9. Worker job kind registry for the currently supported job families.
10. Shared status and execution-result types for worker jobs.
11. Shared retry policies and retry state helpers.

Does not belong here:

1. React pages or UI components.
2. Next.js route handlers used directly by the browser.
3. Template editor canvas logic.
4. Public demo data.
5. Heavy queue or runtime dependencies before they are actually used.
6. SMTP secrets, provider credentials, or environment-specific values.
7. OCR extractor implementations or CSV parser internals that belong in shared packages.
8. Cron provider configuration before a scheduler runtime is selected.
9. Unregistered job families without a clear product use case.
10. Database persistence for job history before the storage model is designed.
11. Queue adapter configuration before the runtime is selected.

### apps/desktop

The desktop workspace is reserved for a future Electron app under `apps/desktop`. Do not add Electron packages, native packaging, update systems, or OS integrations until the web app is stable and desktop requirements are defined.

Allowed now:

1. Runtime-neutral TypeScript contracts.
2. Notes about future desktop responsibilities.
3. Shared package usage planning.

Not allowed yet:

1. Heavy desktop dependencies.
2. Native build tooling.
3. Duplicated UI copied from the web app.
4. Production secrets or local machine paths.
