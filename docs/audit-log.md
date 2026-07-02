# Audit Log

## Events

- Login: `auth.login`
- Logout: `auth.logout`
- User creation: `user.create`
- User deletion: `user.delete`
- Invoice finalization: `invoice.finalize`
- Invoice deletion: `invoice.delete`
- Settings updates: `settings.*.update`

## Overview

Dream Invoice records operational audit events for security review and troubleshooting. Audit views provide filtering by date and searchable event metadata.

## Data Handling

Audit records should capture enough context for review without storing credentials, tokens, full request bodies, or sensitive customer payloads.
