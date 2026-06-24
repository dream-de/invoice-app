# Lizenzkompatibilitaet Phase 4

Stand: 2026-06-24
Branch: dev/dreaminvoice-premium

## Ziel

Die neue SaaS-Architektur wird als zentrale Kompatibilitaetsschicht aktiviert. Alte Lizenzlogik bleibt aktiv und wird als Fallback genutzt. Es wurden keine Lizenz-APIs, Premium-Rollen, Datenbankfelder oder Lizenzschluessel entfernt.

Backup vor Start:

- `/opt/invoice-app/backups/phase4-compatibility-layer-20260624-170823/`

## 1. Erstellte Compatibility Layer

- `apps/web/src/lib/feature-flags/compatibility.ts`
  - `resolveSaasCompatibility()`: fuehrt neue Architektur und alte Lizenzdaten zu einer Entitlement-Sicht zusammen.
  - `hasFeature(feature, input)`: zentrale Feature-Pruefung fuer `ocr`, `datev`, `api_premium` und alle neuen Flags.
  - `createFeatureChecker(input)`: vorkonfigurierte Feature-Pruefung fuer UI/Module.
  - `getInstalledMarketplaceExtensions(input)`: loest aktive Marketplace-Erweiterungen aus Feature Flags und Extension Keys auf.
  - `translateLegacyPremiumRole(role, premiumRole)`: uebersetzt Legacy-Premium-Rollen in neue Berechtigungsaktionen.
- `apps/web/src/lib/feature-flags/compatibility.test.ts`
  - prueft Alias-Normalisierung.
  - prueft `premiumLicense -> business + ocr/datev/api_premium`.
  - prueft neue Architektur plus alte Fallback-Features.
  - prueft Premium-Rollen-Uebersetzung ohne Feature-Freischaltung.
  - prueft Marketplace-kompatible installierte Erweiterungen.

## 2. Aktivierte neue Systeme

- Zentrale Feature-Flags:
  - `feature.ocr`
  - `feature.datev`
  - `feature.banking`
  - `feature.api_premium`
  - `feature.multitenant`
  - `feature.portal_pro`
  - `feature.shopify`
  - `feature.woocommerce`
  - `feature.ai_assistant`
  - `feature.document_ai`
  - `feature.warehouse`
  - `feature.inventory`
  - `feature.time_pro`
  - `feature.resource_planning`
- Marketplace-kompatible Erweiterungen:
  - OCR KI
  - DATEV
  - Banking
  - API Premium
  - Multi-Mandanten
  - Kundenportal Pro
- `apps/web/src/lib/saas-license-architecture.ts` nutzt jetzt dieselben `feature.*` Flags wie der Phase-3-Migrationsplan.
- Das neue Lizenz-&-Abrechnung-Modul nutzt `resolveSaasCompatibility()` und `createFeatureChecker()` fuer den Architekturstatus und installierte Erweiterungen.

## 3. Alte Systeme bleiben aktiv

- `licenseKey` und signierte `INV1` Lizenzschluessel.
- `License` und `LicenseIssue` Tabellen.
- `/api/settings/license/activate`
- `/api/settings/license/verify`
- `/api/settings/license/generate`
- `License.maxUsers` und DB-Trigger `enforce_user_license_limit`.
- `admin`/Legacy-Rollen als Verwaltungs- und Permission-Gates.
- Klassische Lizenzseiten:
  - `/dashboard-v2/license`
  - `/dashboard-v2/license-admin`
  - `/dashboard-v2/settings/license`
- Klassisches Aktivierungsformular in `/settings/users`.

## 4. Vorrang und Fallback

Regel:

1. Neue Architektur liefert Plan, Feature Flags und Marketplace-Erweiterungen.
2. Alte Lizenzarchitektur wird als Fallback ergaenzt, damit Bestandskunden keine Funktionen verlieren.
3. Premium-Rollen werden in Berechtigungen uebersetzt, aber nicht mehr als Feature-Freischaltung behandelt.

Beispiel:

```txt
premium_license = true
```

wird in der Kompatibilitaetsschicht:

```txt
plan = business
feature.ocr = true
feature.datev = true
feature.api_premium = true
marketplace = OCR KI, DATEV, API Premium
```

## 5. Phase-5-Bereitschaft

Bereit fuer Phase 5:

- Feature-Pruefungen koennen zentral auf `hasFeature()` umgestellt werden.
- UI-Module koennen `createFeatureChecker()` nutzen.
- API- und Service-Code kann `resolveSaasCompatibility()` verwenden, ohne alte APIs zu entfernen.
- Marketplace-Installationen koennen gegen `getInstalledMarketplaceExtensions()` gespiegelt werden.
- Premium-Rollen koennen schrittweise aus Feature-Freischaltungen entfernt werden, weil `translateLegacyPremiumRole()` nur Permissions erzeugt.

Noch nicht migriert:

- Keine DB-Tabellen fuer Subscription, Marketplace Installation, Feature Assignment oder Seat Allocation wurden angelegt.
- Alte License APIs schreiben noch keine neuen Shadow-Daten.
- Produktive API-/Service-Feature-Gates sind noch nicht vollstaendig auf `hasFeature()` umgestellt.
