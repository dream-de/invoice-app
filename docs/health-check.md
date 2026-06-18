# Health Check

## Endpoint

`GET /api/health`

## Antwort

```json
{
  "application": "ok",
  "database": "ok",
  "storage": "ok",
  "timestamp": "2026-06-17T00:00:00.000Z"
}
```

## Monitoring

Der Endpoint eignet sich fuer externe Uptime-Checks und interne Smoke-Tests. HTTP 200 bedeutet, dass Anwendung, Datenbank und Speicher grundsaetzlich verfuegbar sind. HTTP 503 signalisiert eine kritische Stoerung.

## Wartungsmodus

Der Wartungsmodus ist ueber `DREAM_INVOICE_MAINTENANCE_MODE=true` vorbereitet. Die Wartungsseite ist unter `/maintenance` erreichbar. Administratorzugriff bleibt fachlich vorgesehen; produktive Aktivierung sollte zusammen mit der finalen Auth-/Proxy-Regel erfolgen.
