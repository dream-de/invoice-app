# Health Check

## Endpoint

`GET /api/health`

## Response

```json
{
  "application": "ok",
  "database": "ok",
  "storage": "ok",
  "time": "ISO-8601 time"
}
```

## Monitoring

The endpoint is suitable for uptime checks. HTTP 200 means the application, database, and storage are available. HTTP 503 signals a critical service issue.

## Maintenance Mode

Maintenance mode can be enabled with `DREAM_INVOICE_MAINTENANCE_MODE=true`. The maintenance page is available at `/maintenance`.
