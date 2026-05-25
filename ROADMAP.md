# Dream Invoice Roadmap

This roadmap describes the current product direction for Dream Invoice. It is intentionally practical: public foundation first, production readiness next, enterprise maturity later.

## Current Focus

Dream Invoice is in the public foundation phase. The main goal is to keep the repository safe, understandable, and ready for controlled self-hosted deployments while the product features continue to mature.

## Phase 1: Public Foundation

Status: in progress

- Keep the web app stable for invoices, offers, customers, articles, finance, templates, and settings
- Keep demo and landing data fictional and safe for public screenshots
- Maintain CI quality gates for linting, type checking, tests, builds, release checks, and dependency audits
- Keep Docker development helpers simple and documented
- Keep internal foundations, such as admin, accounting, server API, worker, desktop, and pro desktop, clearly marked as not production-ready

## Phase 2: Production Hardening

Status: planned

- Document and verify production deployment requirements for HTTPS, reverse proxy, firewall, backups, and environment variables
- Strengthen operational runbooks for database, migrations, worker jobs, and rollback procedures
- Expand audit logging integration for sensitive business and administrative actions
- Document security boundaries between public apps and internal foundations
- Add practical monitoring recommendations for uptime, logs, database health, and scheduled jobs
- Improve release notes, versioning, and upgrade guidance

## Phase 3: Advanced Hardening

Status: planned

- Add a formal secret rotation policy for auth secrets, database credentials, and license keys
- Add optional secret scanning and SAST guidance for public or team deployments
- Add a deployment checklist for development, staging, and production environments
- Document Docker image optimization and multi-stage build strategy before changing runtime images
- Add performance guidance for Next.js, Prisma, PostgreSQL, workers, and exports
- Add database schema evolution guidelines for migrations, backups, and restore testing
- Add API documentation strategy for future server API surfaces

## Phase 4: Enterprise Readiness

Status: future

Enterprise features are not the current implementation target. They are tracked here so future work has a clear direction.

- Threat modeling and compliance mapping for GDPR, ISO 27001, SOC 2, or similar frameworks where relevant
- High availability and disaster recovery architecture with RPO/RTO targets
- Observability stack with metrics, logs, traces, alerts, and incident response procedures
- Artifact signing, SBOM generation, and supply chain provenance
- Data retention, export, deletion, and anonymization policies
- Support tiers, SLA/SLO definitions, feature flags, and version lifecycle policies
- Accessibility compliance roadmap for WCAG 2.1 AA
- Internationalization strategy for additional languages, currencies, and tax rules

## Product Direction

The near-term product direction is:

- Polish the main web app before expanding deployment surfaces
- Keep the public demo useful, safe, and disconnected from real data
- Build desktop and pro desktop foundations only when the web app is stable enough
- Keep mobile browser support responsive before committing to a native mobile app
- Prefer clear documentation and small verified changes over large speculative rewrites

## Non-Goals For Now

- Kubernetes-first deployment
- Multi-region infrastructure
- Service mesh architecture
- Complex enterprise compliance automation
- Public exposure of admin, accounting, server API, or worker foundations without explicit hardening
