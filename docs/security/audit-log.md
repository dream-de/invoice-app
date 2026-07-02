# Audit Log

Dream Invoice uses audit records for security-relevant and operational events.

## Current Events

Tracked events include:

- User creation
- User updates
- User deactivation
- License activation
- License verification results where applicable
- Security-sensitive settings changes where applicable

## Recommended Fields

Audit records should include:

- Actor user id or system actor
- Action name
- Entity type
- Entity id when available
- Event time
- Result
- Reason or context
- Relevant metadata

## Data Boundaries

Audit records should keep enough context for troubleshooting while avoiding sensitive payloads. Store references and summaries instead of raw credentials, tokens, license signing keys, full SMTP passwords, or large document contents.

## Review

Review audit logs during:

- Account changes
- License changes
- Settings changes
- Security investigations
- Deployment handover
