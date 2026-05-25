# Audit Log

Dream Invoice includes an `AuditLog` database model for traceability of sensitive business and administrative actions.

## Current Scope

The current implementation records metadata for:

- License activation
- Company settings changes
- Number range changes
- Invoice finalization
- Invoice deletion

## Data Rules

Audit entries must be useful for review without becoming a second copy of sensitive business data.

Do record:

- Action name
- Entity name
- Entity id when available
- Short reason
- Safe metadata such as plan, status, affected field names, document number, or range type

Do not record:

- Raw license keys
- Passwords or auth secrets
- Private signing keys
- Full customer records
- Full bank details
- Production environment values

## Failure Policy

Audit logging should not break the primary user action. If an audit write fails, the app logs a warning and continues.

This keeps the application usable during non-critical audit storage issues while still surfacing the problem in logs.

## Future Scope

Planned future audit coverage:

- User and permission changes
- Email sending configuration changes
- Document send actions
- Payment status changes
- Import and export actions
- Admin-only actions when admin surfaces become production-ready
