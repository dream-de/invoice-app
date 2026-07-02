# DreamInvoice Merge Readiness - Phase 13/14

Status: Merge vorbereitet, kein Merge ausgefuehrt.

## Finale Architekturpruefung

- Planmodell: zentrale SaaS-Plaene in `packages/premium/src/license-billing.ts`.
- Marketplace: zentrale Module, Kategorien und Statusauflösung in `packages/premium/src/license-billing.ts`.
- Feature Flags: zentrale Pruefung ueber `hasFeature()` und Compatibility-Aliase in `packages/premium/src/feature-flags.ts`.
- Enterprise/Offline: Aktivierungsmodelle und `resolveLicenseRuntime()` sind vorbereitet.
- Compatibility Layer: alte Lizenz-APIs, Lizenzschluessel, Lizenzdatei und Legacy-Premium-Rollen bleiben als Fallback erhalten.

## Bereinigte Reste

- Alte Plan-Hinweise in Benutzer-/Plantexten wurden von Lizenzschluessel-Sprache auf Plan/Marketplace/Enterprise-Aktivierung umgestellt.
- Die sichtbare Lizenzschluessel-Eingabe bleibt nur unter `Einstellungen -> Lizenz & Abrechnung -> Erweiterte Aktivierung`.
- Keine alten APIs, Datenbankfelder oder Compatibility-Funktionen wurden entfernt.

## Bewusst verbleibende Fallbacks

- `/api/settings/license/activate`
- `/api/settings/license/verify`
- `/api/settings/license/generate`
- `apps/web/src/lib/license/*`
- `translateLegacyPremiumRole()` und `mapLegacyLicenseToSaasEntitlements()`
- `/dashboard-v2/license-admin` fuer geschuetzte interne Key-Erzeugung

## Commits seit main

Der Branch `dev/dreaminvoice-premium` enthaelt eine groessere Premium-Historie seit `main`. Die neuesten Architektur-Commits sind:

- `8510c6e` Activate marketplace and dynamic premium modules
- `59a6752` Remove legacy premium roles and license key logic
- `e671b55` Migrate premium licensing to plans marketplace and feature flags

## Konfliktrisiken vor main-Merge

- Hoch: `apps/web/src/app/dashboard-v2/PremiumWorkspace.tsx` hat viel Premium-UI-Historie und ist konfliktanfaellig.
- Mittel: Settings-Navigation und Lizenz-&-Abrechnung-Routen koennen mit parallelen Settings-Aenderungen kollidieren.
- Mittel: i18n-Dateien wurden mehrfach erweitert; JSON-Konflikte sind wahrscheinlich, aber mechanisch loesbar.
- Niedrig: `packages/premium` ist neu/zentralisiert, sollte aber gegen main-Workspace-Konfiguration geprueft werden.

## Offene TODOs vor echter Produktivumschaltung

- Alte Lizenz-APIs erst nach echter Datenmigration entfernen.
- `feature.api_premium` bleibt UI-/Compatibility-Alias auf `feature.api`; eine harte Umbenennung braucht Migrationsfenster.
- Turbopack/NFT-Warnung aus `attachments/storage.ts` separat bereinigen.

## Merge-Empfehlung

Bereit fuer einen kontrollierten Merge-Versuch nach main: ja, wenn die vollstaendige QA gruen bleibt und der Merge als PR mit manueller Konfliktpruefung erfolgt. Kein direkter Merge auf dem Server empfohlen.
