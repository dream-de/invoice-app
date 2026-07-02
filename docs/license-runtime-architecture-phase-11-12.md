# DreamInvoice License Runtime Architecture - Phase 11/12

Status: vorbereitet, nicht produktiv umgeschaltet.

## Runtime-Aufbau

- `apps/web` bleibt aktive Runtime auf Port 3012.
- Zentrale Premium-Definitionen liegen in `packages/premium/src/license-billing.ts`.

## Lizenzarchitektur

Die neue Architektur bleibt einheitlich:

```text
Plan
-> Marketplace
-> Feature Flags
-> sichtbare/nutzbare Module
```

Der Runtime-Resolver `resolveLicenseRuntime()` fuehrt zusammen:

- Planmodell: Free, Starter, Business, Enterprise
- Marketplace-Module und installierte Erweiterungen
- Feature Flags inklusive Compatibility-Alias `feature.api_premium -> feature.api`
- Enterprise-/Cloud-/Offline-/Self-Hosted-/Trial-/Demo-Aktivierung

## Aktivierungsfluss

1. Aktivierungsmodus bestimmen: `cloud`, `enterprise`, `offline`, `self-hosted`, `trial`, `demo`.
2. Zielplan bestimmen: expliziter Plan oder Default des Aktivierungsmodells.
3. Marketplace-Module und Feature Flags aufloesen.
4. Status ableiten: `Vorbereitet`, `Aktivierungsbereit`, `Offline bereit`, `Cloud bereit`.
5. Legacy Compatibility Layer bleibt aktiv fuer bestehende Lizenzschluessel und Lizenzdateien.

## Enterprise-Aktivierung

Enterprise verwendet den Enterprise-Plan, alle Feature Flags und kann Cloud-Sync, Lizenzdatei und Lizenzschluessel kombinieren. Self-Hosted ist als Enterprise-nahe Offline-Variante vorbereitet.

## Offline-Aktivierung

Offline nutzt signierte Lizenzdatei oder optionalen Lizenzschluessel ohne dauerhafte Cloud-Verbindung. Die UI liegt unter:

```text
Einstellungen -> Lizenz & Abrechnung -> Erweiterte Aktivierung
```

Bereiche dort:

- Lizenz synchronisieren
- Lizenzdatei importieren
- Lizenzschluessel optional
- Offline-Aktivierung
- Aktivierungsstatus
- Lizenzinformationen

## Docker-Vorbereitung

Port 3012 bleibt unveraendert bei `apps/web`.
