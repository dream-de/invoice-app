# App Structure

Dream Invoice is organized as a pnpm and Turborepo monorepo.

## Apps

```text
apps/
  web/            Main Dream Invoice product app.
  demo/           Demo app with fictional sample data.
  landing-page/   Product website.
  admin/          Admin companion app.
  accounting/     Accounting companion app.
  server/         Server app workspace.
  server-api/     API companion workspace.
  desktop/        Desktop workspace.
  pro-desktop/    Pro desktop workspace.
  web-pro/        Pro web workspace.
```

## Packages

```text
packages/
  database/          Prisma schema, migrations, and client exports.
  ui/                Shared UI building blocks and design tokens.
  auth/              Roles, request guards, and auth-related helpers.
  licensing/         Signed license verification and entitlement helpers.
  invoice-core/      Invoice calculations and domain helpers.
  accounting-core/   Accounting domain helpers.
  tax/               Tax and rounding helpers.
  pdf/               PDF helper models and utilities.
  config/            Shared configuration.
  utils/             Shared utilities.
  ocr/               OCR workspace.
  desktop packages  Desktop-specific shared packages.
```

## Deployment Stacks

The product stack uses the root `docker-compose.yml` and starts:

- PostgreSQL
- Dream Invoice web app
- Nginx app proxy

The website stack uses `docker/public-site.compose.yml` and starts the demo and landing-page services separately.

## Shared Logic

Reusable business rules should live in packages before they are copied across apps.

Good candidates:

- Invoice totals and rounding
- Tax logic
- PDF data models
- License verification
- Auth and role checks
- Import/export helpers

## Naming

Use package imports for shared code:

```ts
import { prisma } from "@dream-invoice/database"
import { verifySignedLicenseDocument } from "@dream-invoice/licensing/signed-license"
```

App-only UI and route code should stay inside its app until another app needs it.
