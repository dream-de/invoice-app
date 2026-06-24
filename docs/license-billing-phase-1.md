# Lizenz & Abrechnung Phase 1

Stand: 2026-06-24
Branch: dev/dreaminvoice-premium

## Ziel

Diese Phase bereitet die neue SaaS-Architektur additiv vor. Es wurde keine Migration ausgefuehrt und keine bestehende Lizenzlogik entfernt.

## Neue Struktur

- Dashboard-V2 Settings: `/dashboard-v2/settings/license-billing`
- Unterseiten:
  - `/overview`
  - `/plans`
  - `/seats`
  - `/extensions`
  - `/marketplace`
  - `/usage-limits`
  - `/billing-invoices`
  - `/advanced-activation`
- Architektur-Konstanten: `apps/web/src/lib/saas-license-architecture.ts`

## Bestehende alte Lizenzlogik

- `apps/web/src/lib/license/activate.ts`: Aktiviert signierte Lizenzschluessel und schreibt aktive Lizenzen.
- `apps/web/src/lib/license/admin.ts`: Schuetzt interne Lizenzadministration per Env/Owner.
- `apps/web/src/lib/license/issue.ts`: Erzeugt Lizenzschluessel fuer den Admin-Modus.
- `apps/web/src/lib/license/keys.ts`: Hash, Preview und Verify von Lizenzschluesseln.
- `apps/web/src/lib/license/limits.ts`: Aktives Benutzerlimit aus Lizenz oder Free-Fallback.
- `apps/web/src/lib/license/plans.ts`: Bisherige Planliste inklusive `free`, `starter`, `pro`, `team`, `business`, `enterprise`, `unlimited`.
- `apps/web/src/lib/license/settings.ts`: Lizenz-Zusammenfassung fuer Settings.
- `packages/licensing/src/*`: Signierte Lizenzdokumente, Features, Entitlements, Status und User-Limit Enforcement.
- Bestehende Seiten bleiben erreichbar: `/dashboard-v2/license` und `/dashboard-v2/license-admin`.

## Bestehende Premium-Rollen und Rollenlogik

- Auth-Rollen sind derzeit `admin` und `user` in `packages/auth/src/models/user.ts`.
- Legacy-/Altrollen werden beim Lesen teilweise normalisiert: `owner -> admin`, `accountant -> user` in `apps/web/src/lib/auth/service.ts`.
- Tests sichern, dass entfernte Rollen wie `accountant` fuer neue Writes abgelehnt werden.
- Berechtigungen liegen als `scope` + `action` an Benutzern, unter anderem in `apps/web/src/lib/users/permissions.ts` und `UserPermission` im Prisma-Schema.
- Fuer die neue SaaS-Architektur sind Rollen nur noch fuer Berechtigungen vorgesehen: Lesen, Erstellen, Bearbeiten, Loeschen, Freigeben, Exportieren.

## Betroffene Lizenz-APIs

- `POST /api/settings/license/activate`
- `POST /api/settings/license/verify`
- `GET /api/settings/license/generate`
- `POST /api/settings/license/generate`

Diese APIs wurden nicht entfernt und nicht migriert. Die neue Unterseite `Erweiterte Aktivierung` verweist bewusst auf die bestehenden Aktivierungsmechanismen.

## Spaeter zu migrierende Bereiche

- Planmodell von alter Lizenzplanliste auf SaaS-Plans `Free`, `Starter`, `Business`, `Enterprise`.
- Premium-Funktionsfreischaltung aus Rollen entfernen und in Plan-/Marketplace-/Feature-Flag-Entitlements verschieben.
- Benutzerlimit-Quelle von `license.maxUsers` auf SaaS-Seats/Billing-Quelle umstellen.
- Marketplace-Kaufstatus und installierte Erweiterungen persistieren.
- Nutzung & Limits an echte Zaehler fuer Benutzer, Kunden, Dokumente, OCR, API Requests und Speicherplatz anbinden.
- Abrechnung & Rechnungen an Subscription-, Invoice- und Payment-Status anbinden.
- Erweiterte Aktivierung spaeter auf Lizenz-Sync und Dateiimport mit SaaS-Backend erweitern.
- Navigation nach Migration final bereinigen, insbesondere alte direkte Lizenzseiten nur noch als technische Aktivierung oder Admin-Fallback fuehren.
