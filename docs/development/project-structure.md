# Project Structure

Dream Invoice is organized as a pnpm monorepo. The repository is not split into
separate `dev`, `prod`, or `test` folders. Development state is handled through
Git branches, while folders describe product areas, shared packages, deployment
assets, and tests.

## Top-Level Folders

| Folder | Purpose |
| --- | --- |
| `apps/` | Runnable applications and services. |
| `packages/` | Shared libraries used by one or more apps. |
| `database/` | Prisma schema, migrations, and seed data. |
| `docker/` | Docker Compose files, images, nginx, postgres, redis, and helper scripts. |
| `docs/` | Architecture, deployment, operations, security, and development documentation. |
| `scripts/` | Repository automation scripts. |
| `tests/` | Cross-app tests, e2e flows, and integration-style test assets. |
| `tools/` | Internal tooling that is not part of runtime application code. |
| `assets/` and `logos/` | Static project assets and branding files. |

## Apps

| App | Purpose |
| --- | --- |
| `apps/web` | Main Dream Invoice web application. |
| `apps/admin` | Admin-facing application. |
| `apps/accounting` | Accounting-focused application area. |
| `apps/landing-page` | Public landing page. |
| `apps/demo` | Demo app or demo-specific entry point. |
| `apps/desktop` and `apps/pro-desktop` | Desktop app targets. |
| `apps/server`, `apps/server-api`, `apps/server-worker` | Backend/server-oriented services. |
| `apps/web-pro` | Pro web variant or future pro app surface. |

## Packages

Packages keep shared code out of app folders. This avoids copying logic between
apps and keeps product behavior easier to test.

Important package groups:

| Package Area | Purpose |
| --- | --- |
| `packages/ui` | Shared UI components. |
| `packages/auth` | Authentication-related shared code. |
| `packages/database` | Shared database access utilities. |
| `packages/invoice-core` | Invoice domain logic. |
| `packages/accounting-core` | Accounting domain logic. |
| `packages/pdf` | PDF generation and document rendering helpers. |
| `packages/ocr` | OCR import and extraction logic. |
| `packages/licensing` | License handling. |
| `packages/config` | Shared configuration utilities. |
| `packages/utils` | General reusable utilities. |
| `packages/desktop-*` | Desktop-specific state, services, data, UI, and contracts. |

## Development Folders

The project should keep development-only material in focused folders:

| Folder | Use For |
| --- | --- |
| `docs/development/` | How the repository is structured and how development is done. |
| `tools/` | Internal utilities, generators, release helpers, and one-off tool code. |
| `scripts/` | Repeatable automation commands used by developers or CI. |
| `tests/` | Tests that cover behavior across apps or larger flows. |

Avoid creating a top-level `dev/` folder unless it contains real tooling with a
clear purpose. A `develop` branch is a Git branch, not a folder.

## Recommended Future Shape

For the current project size, the existing monorepo layout is a good fit. The
best next improvements are documentation and cleanup, not a large folder
rewrite.

Recommended rules:

- Keep app-specific code inside the matching `apps/*` folder.
- Move reused logic into `packages/*` only when at least two apps need it or the
  logic is important enough to test independently.
- Keep Docker and deployment concerns in `docker/` and `docs/deployment/`.
- Keep security decisions and production hardening notes in `docs/security/`.
- Keep test fixtures and cross-app test flows in `tests/`.
- Do not keep long-term backup folders or backup branches in the repository.
