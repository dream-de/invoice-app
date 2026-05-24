# Security Policy

## Supported Versions

Dream Invoice is currently in active early development. Security fixes are handled on the main branch until the first public stable release is defined.

## Reporting a Vulnerability

Please do not open public issues that contain secrets, exploit details, real customer data, private license keys, or production credentials.

Report security-sensitive findings privately to the repository owner. Include:

- A short summary of the issue
- Affected area or route
- Steps to reproduce, if safe to share
- Expected impact
- Suggested mitigation, if known

## Secret Handling

Never commit:

- Production `.env` files
- Private license keys
- Customer license keys
- Real SMTP credentials
- Real database dumps
- Real customer invoices or screenshots

Use the local development Docker setup and Mailpit for safe email testing.
