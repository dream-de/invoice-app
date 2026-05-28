# Security Policy

Dream Invoice accepts security-sensitive reports through the repository owner or maintainer contact path.

## Reporting

For security-sensitive findings, include:

- A short summary
- Affected version, commit, or deployment type
- Steps to reproduce when they can be shared responsibly
- Impact and suggested mitigation, if known

Security-sensitive reports should not include credentials, license signing keys, production `.env` files, database dumps, customer records, or access tokens.

## Supported Versions

Until a stable versioning policy is available, security fixes are handled on the main branch.

## Secret Handling

Keep operational secrets in deployment environments and local `.env` files. Source-controlled examples should use example values only.

Sensitive values include:

- Production `.env` files
- Database credentials
- SMTP credentials
- Auth secrets
- License signing keys
- API keys and access tokens

## Development Email

Use the local development Docker setup and Mailpit for email testing.

## Dependency Audit

Run:

```bash
pnpm security:audit
```

The full release quality gate also includes the dependency audit:

```bash
pnpm release:quality
```
