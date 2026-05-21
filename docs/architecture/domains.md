# Domain Structure

Dream Invoice is structured for a public repository and a professional hosted product. Domains are documented here first; they should be wired into deployment only when DNS, hosting, and environments are ready.

## Public Domain Plan

```txt
dream-invoice.com       Public product website and landing page.
demo.dream-invoice.com  Public demo with sample data only.
app.dream-invoice.com   Production web app for real users and login.
api.dream-invoice.com   Optional separated API host once server deployment is split.
docs.dream-invoice.com  Optional public documentation site.
```

## App Mapping

```txt
apps/landing-page  -> dream-invoice.com
apps/demo          -> demo.dream-invoice.com
apps/invoice       -> app.dream-invoice.com
apps/server        -> api.dream-invoice.com, if API is deployed separately later
apps/server-worker -> internal only, no public domain
```

## Rules

1. Do not hard-code these domains inside app code until deployment is configured.
2. Use environment variables for public URLs when the domains go live.
3. Keep demo data fake and resettable.
4. Keep production data isolated from demo data.
5. Keep secrets out of the repository; use `.env.example` for public configuration examples.
6. Keep worker services private/internal unless a public endpoint is explicitly required.

## Public Repository Notes

This structure is valid for both private and public GitHub repositories. For a public repository, the README can later link to:

```txt
Website: https://dream-invoice.com
Demo:    https://demo.dream-invoice.com
App:     https://app.dream-invoice.com
Docs:    https://docs.dream-invoice.com
```

Do not publish real customer data, real bank data, private API keys, SMTP credentials, or production environment files.
