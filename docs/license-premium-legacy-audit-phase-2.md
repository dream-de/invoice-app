# Lizenz-/Key-/Premium-Rollen-Audit Phase 2

Stand: 2026-06-24
Branch: dev/dreaminvoice-premium

## Ziel und Scope

Diese Analyse dokumentiert die bestehende alte Lizenz-, Key- und Premium-Rollen-Logik. Es wurde nichts geloescht, nichts migriert, keine API entfernt und kein Datenbankfeld entfernt. Die Phase-1-Struktur `/dashboard-v2/settings/license-billing` bleibt als neue Zielstruktur erhalten.

## Suchmuster

Geprueft wurden unter anderem:

- `licenseKey`, `license_key`
- `premiumLicense`, `premium_license`
- `premiumRole`, `premium_role`
- `license.activate`, `license.generate`, `license.verify`
- `license-admin`
- Premium Settings, Premium Fallback, role based premium unlocks
- `Premium`, `license`, `enabledFeatures`, `entitlements`, `maxUsers`, `role`, `permissions`

Direkte Felder oder Implementierungen fuer `premiumLicense`, `premium_license`, `premiumRole` oder `premium_role` wurden nicht gefunden. Die relevanten Alt-Abhaengigkeiten liegen in License/LicenseIssue, signierten License Keys, Plan-Entitlements, Admin-Rollenchecks und User-Limits.

## 1. Betroffene Dateien

### Web Lizenz-Key und Lizenzstatus

- `apps/web/src/lib/license/activate.ts`: Aktiviert signierte Lizenzschluessel, widerruft alte aktive Lizenzen, upsertet `License`, markiert `LicenseIssue` als aktiviert.
- `apps/web/src/lib/license/keys.ts`: Hash, Preview und Verify fuer Lizenzschluessel.
- `apps/web/src/lib/license/issue.ts`: Erzeugt signierte `INV1` Lizenzschluessel und schreibt `LicenseIssue`.
- `apps/web/src/lib/license/limits.ts`: Liest aktive Lizenz und ermittelt `activeUsers`, `maxUsers`, `remainingUsers`, `limitReached`.
- `apps/web/src/lib/license/plans.ts`: Alte Planliste `free`, `starter`, `pro`, `team`, `business`, `enterprise`, `unlimited`.
- `apps/web/src/lib/license/settings.ts`: Fallback-Zusammenfassung fuer Lizenzstatus, falls Limitstatus nicht geladen werden kann.
- `apps/web/src/lib/license/admin.ts`: Schaltet internen Lizenz-Admin per Env frei und begrenzt ihn optional auf Owner-E-Mail.
- `apps/web/src/lib/audit/log.ts`: Audit Actions `license.activate`, `license.generate`, `license.verify`.

### Web Lizenz-APIs

- `apps/web/src/app/api/settings/license/activate/route.ts`: `POST`, admin-only, validiert `licenseKey`, ruft `activateLicenseKey`, schreibt Audit.
- `apps/web/src/app/api/settings/license/verify/route.ts`: `POST`, admin-only, verifiziert `licenseKey`, prueft `LicenseIssue`, schreibt Audit.
- `apps/web/src/app/api/settings/license/generate/route.ts`: `GET` und `POST`, admin + License-Admin-Guard, listet und erzeugt License Issues.
- `apps/web/src/app/api/settings/users/route.ts`: admin-only User-API, liefert `getUserLimitStatus` und blockt Useranlage/-aktivierung indirekt ueber Lizenzlimit.
- `apps/web/src/app/api/premium/actions/route.ts`: Premium Action Logging/Simulation, wird vom License Panel fuer Demo-Key-Pruefung genutzt.

### UI-Seiten und Komponenten mit Lizenzschluesseln

- `apps/web/src/app/dashboard-v2/license/page.tsx`: Route fuer alte Lizenzseite.
- `apps/web/src/app/dashboard-v2/license-admin/page.tsx`: Route fuer interne Key-Erzeugung.
- `apps/web/src/app/dashboard-v2/PremiumWorkspace.tsx`: Enthalten sind `PremiumLicensePanel`, `PremiumLicenseAdminPage`, License Quick Actions, User-Limit-Anzeige, Lizenzdatei-Import und Key-Textarea.
- `apps/web/src/app/settings/users/LicenseActivationForm.tsx`: Klassisches Settings-Formular fuer Lizenzschluessel und Lizenzdatei.
- `apps/web/src/app/settings/users/page.tsx`: Klassische Benutzer-/Rechte-/Lizenzlimit-Seite.
- `apps/web/src/app/dashboard-v2/settings/PremiumSettingsSectionContent.tsx`: Settings-Lizenzbereich und neue Phase-1-Verweise auf erweiterte Aktivierung.
- `apps/web/src/app/dashboard-v2/DashboardV2.module.css`: Styles fuer `licenseKeyForm`, `licenseKeyResult`, License Panels.
- `apps/web/src/i18n/locales/de/settings.json`: Deutsche Texte fuer Lizenzschluessel, Plaene, Aktivierung, Benutzerlimits.

### Package-Lizenzlogik

- `packages/licensing/src/signed-license.ts`: Verifiziert JSON-Envelope und Compact Key `INV1.<payload>.<signature>`, prueft Ablauf, Signatur, Feature und User-Limit.
- `packages/licensing/src/features.ts`: Alte Featureliste, z. B. `datevExport`, `financeAutomation`, `teamUsers`, `apiAccess`, `prioritySupport`.
- `packages/licensing/src/entitlements.ts`: Plan-basierte Feature-Entitlements fuer `free`, `starter`, `pro`, `team`, `business`, `enterprise`, `unlimited`.
- `packages/licensing/src/plans.ts`: Alte Plan-Keys und Labels.
- `packages/licensing/src/license-status.ts`: License Snapshot inklusive optionalem `licenseKey`.
- `packages/licensing/src/index.ts`: Exportoberflaeche.
- `packages/server-core/src/license.ts`: Preview-/Snapshot-Logik fuer Activation und Verification, setzt `canUseProFeatures`.
- `apps/server-api/src/license/routes.ts`: Server-API-Preview-Routen `/license/activate`, `/license/verify`.
- `apps/desktop/src/license-profile.ts`: Desktop-Profil auf Plan `free`.
- `apps/pro-desktop/src/license-profile.ts`: Pro-Desktop-Profil auf Plan `pro`.

### Rollen, Berechtigungen und Premium-Zugriff

- `packages/auth/src/models/user.ts`: Gueltige Auth-Rollen `admin`, `user`.
- `packages/auth/src/services/roles.ts`: `hasRole`, `isAdmin`.
- `packages/auth/src/guards/accounting.ts`: Accounting-Zugriff nur fuer `admin`.
- `apps/web/src/lib/auth/service.ts`: Rollen-Normalisierung, `requireCurrentUserRole`, Legacy-Map `owner -> admin`, `accountant -> user`.
- `apps/web/src/lib/auth/permissions.ts`: Page Permission Guard ueber effektive Permissions.
- `apps/web/src/lib/users/permissions.ts`: Permission-Gruppen und Default-Rechte; `admin` bekommt alle Rechte, `user` bekommt Default-Basisrechte.
- `apps/web/src/lib/users/service.ts`: Useranlage/-aktivierung prueft Lizenzlimit; entfernte Rollen werden fuer neue Writes abgelehnt.
- `apps/web/src/components/LocalizedNavigationShell.tsx`: Navigation wird ueber Permissions gesteuert.
- `apps/web/src/app/api/settings/users/route.ts`: User-Verwaltung ist admin-only.

### Datenbank und Migrationen

- `packages/database/prisma/schema.prisma`: `User.role`, `UserPermission`, `License`, `LicenseIssue`.
- `packages/database/prisma/migrations/20260516033537_add_license_users_permissions/migration.sql`: Erzeugt `UserPermission` und `License`.
- `packages/database/prisma/migrations/20260516040131_enforce_user_license_limit/migration.sql`: DB-Trigger fuer User-Limit.
- `packages/database/prisma/migrations/20260516040339_harden_license_constraints/migration.sql`: License Constraints und Single-Active-Index.
- `packages/database/prisma/migrations/20260525093000_harden_license_constraints_and_indexes/migration.sql`: Erweitert Planliste um `pro`, haertet `maxUsers`.
- `packages/database/prisma/migrations/20260528090000_admin_user_roles/migration.sql`: Migriert `owner` und `accountant` auf `admin`/`user`.
- `packages/database/prisma/migrations/20260611043000_add_license_issue/migration.sql`: Erzeugt `LicenseIssue`.
- `packages/database/prisma/migrations/20260617180000_phase_18_19_multi_tenant_api/migration.sql`: Fuehrt `UserCompanyMembership.role`, API Keys, Webhooks und Integrations ein.

### Tests

- `packages/licensing/src/__tests__/signed-license.test.ts`: Signierte Lizenzverifikation, Limits und Feature-Pruefung.
- `apps/web/src/lib/users/__tests__/service.test.ts`: Useranlage, Lizenzlimit, entfernte Rollen, letzte Admin-Sicherung, Permissions.
- `apps/web/src/lib/auth/__tests__/service.test.ts`: Auth-Rollen und Setup-/Admin-Verhalten.
- `apps/server-api/test/server-api-foundation.test.ts`: License Preview API fuer Activate/Verify.
- `apps/desktop/test/desktop-foundation.test.ts`: Desktop Free-Profil.
- `apps/pro-desktop/test/pro-desktop-foundation.test.ts`: Pro-Desktop Lizenzprofil.

## 2. Alte Lizenz-/Key-Funktionen

- `hashLicenseKey(licenseKey)`: SHA-256 Hash des getrimmten Keys fuer Speicherung und Lookup.
- `previewLicenseKey(licenseKey)`: Maskierte Key-Anzeige.
- `verifyLicenseKey(licenseKey)`: Wrapper um signierte Lizenzverifikation mit `LICENSE_PUBLIC_KEY`.
- `verifySignedLicenseDocument(document, publicKey)`: Verifiziert JSON Envelope oder Compact `INV1` Key.
- `canonicalizeLicensePayload(value)`: Stabile JSON-Kanonisierung fuer Signatur.
- `getLicenseExpiry(payload)`, `getLicenseCustomerName(payload)`, `getLicenseUserLimit(payload)`: Payload-Ableitungen.
- `hasLicensedFeature(payload, feature)`, `assertLicensedFeature(payload, feature)`: Alte Feature-Pruefung ueber Payload oder Plan-Entitlements.
- `enforceUserLimit(activeUsers, maxUsers)`: Wirft bei erreichtem Benutzerlimit.
- `activateLicenseKey(licenseKey)`: Verifiziert Key, revoket bestehende aktive Lizenzen, schreibt `License`, markiert `LicenseIssue`.
- `generateLicenseKey(input, issuedByUserId)`: Erstellt signierten `INV1` Key mit Plan, Billing Cycle, Edition, MaxUsers, Features und Customer-Daten.
- `getUserLimitStatus()`: Ermittelt aktives Userlimit aus aktiver `License`, sonst Free-Fallback.
- `assertCanCreateUser()`: Kapselt Userlimit-Pruefung fuer Useranlage.
- `getLicenseSettingsSummary()`: Fallbackfaehige Settings-Zusammenfassung.
- `assertLicenseAdminAccess(user)`: Env-/Owner-Guard fuer Key-Erzeugung.
- `createPendingLicenseActivation(request)`, `createLicenseVerificationSnapshot(plan)`: Server-Core Preview-Logik fuer Lizenz-Snapshots.

## 3. Premium-Rollen-Abhaengigkeiten

Direkte Premium-Rollen als Feld oder Enum wurden nicht gefunden. Es gibt aber folgende Alt-Abhaengigkeiten, die fuer Phase 3 relevant sind:

- `admin` ist Gate fuer Lizenzaktivierung, Lizenzverifikation, Key-Erzeugung und User-Verwaltung.
- `admin` bekommt in `getRoleDefaultPermissionKeys` alle Permission Keys.
- `user` bekommt nur Basisrechte: `documents:view`, `documents:pdf`, `customers:view`, `projects:view`.
- `owner` und `accountant` existieren als Legacy-Rollen in Migration/Normalisierung und werden auf `admin` bzw. `user` abgebildet.
- `canAccessAccounting` erlaubt Accounting nur fuer `admin`.
- `requireCurrentUserRole(["admin"])` schuetzt License APIs und Settings Users API.
- Premium-Funktionen sind heute teilweise ueber Plan-Entitlements modelliert, teilweise nur UI-/Produktprofile: `pro-desktop`, Dashboard-V2-Premium-Module.
- User-Seats sind keine Rolle, aber ein Lizenzlimit und blockieren aktive Useranlage/-aktivierung in App-Service und DB-Trigger.

Phase-3-Regel: Rollen duerfen nur Berechtigungen steuern. Premium-Freischaltungen muessen aus Rollenchecks heraus und in Plan + Marketplace + Feature Flags wandern. Admin darf weiter administrative Aktionen ausfuehren, aber nicht automatisch Premium-Features besitzen.

## 4. Betroffene Tabellen und Felder

- `User.role`: Rollenmodell `admin`/`user`, plus Legacy-Migration `owner`/`accountant`.
- `User.status`: relevant fuer aktives Benutzerlimit.
- `UserPermission.scope`, `UserPermission.action`, `UserPermission.allowed`: Berechtigungen und Navigation.
- `License.keyHash`: Hash des Lizenzschluessels.
- `License.plan`: Alter Plan-Key.
- `License.billingCycle`: `free`, `monthly`, `yearly`, `custom`.
- `License.maxUsers`: Seat-Limit fuer Useranlage/-aktivierung.
- `License.status`: `active`, `expired`, `revoked`.
- `License.company`, `License.validUntil`, `License.features`, `License.activatedAt`.
- `LicenseIssue.licenseId`, `keyHash`, `keyPreview`, `plan`, `billingCycle`, `maxUsers`, `status`, `customerId`, `customerName`, `validUntil`, `features`, `issuedByUserId`, `activatedAt`, `activatedLicenseId`.
- DB-Trigger `enforce_user_license_limit`: blockiert aktive User bei erreichtem `License.maxUsers`.
- `UserCompanyMembership.role`: Mandanten-/Firmenrolle aus Phase 18/19, nicht identisch mit Premium-Rolle, aber spaeter bei Rollenmodell sauber abzugrenzen.

## 5. Module an alter Lizenzlogik

- Benutzerverwaltung: Userlimit, Aktivierung, Admin-only Management.
- Lizenzverwaltung: Aktivierung, Dateiimport, Demo-Key-Pruefung, Lizenzstatus.
- Lizenz Admin: Key-Erzeugung, LicenseIssue-Liste, Owner-/Env-Schutz.
- Dashboard-V2 Premium Workspace: Upgrade-Hinweise, License Panels, Premium-Modul-Metadaten.
- Desktop/Web-Pro Profile: Plan `free` bzw. `pro` steuert `enabledFeatures`.
- Server API/Core: Preview-Snapshots fuer Aktivierung/Verifikation.
- Permissions/Navigation: Rollen und Permissions steuern Zugriff, aber nicht sauber von Feature-Entitlements getrennt.
- Datenbank: `License`, `LicenseIssue`, `UserPermission`, User-Limit-Trigger.

## 6. Migrationsempfehlung fuer Phase 3

1. Neue Zielmodelle entwerfen, noch ohne Altlogik zu loeschen:
   - `Plan` fuer Free, Starter, Business, Enterprise.
   - `MarketplaceExtension` und `InstalledExtension`.
   - `FeatureFlag` bzw. `Entitlement` fuer plan- und extensionbasierte Freischaltung.
   - `SeatAllocation` oder Billing Seats als Ersatz fuer `License.maxUsers`.

2. Compatibility Layer einfuehren:
   - Eine zentrale Funktion `getEntitlementsForTenant/user`, die zuerst neue Plan-/Marketplace-/Feature-Flags lesen kann und bei fehlenden Daten auf alte `License`/Package-Entitlements faellt.
   - Alte `License` und `LicenseIssue` bleiben lesbar.
   - Aktivierungs-APIs bleiben kompatibel und schreiben optional zusaetzlich neue Shadow-Daten.

3. Rollenmodell entkoppeln:
   - `admin`/`user` nur fuer Aktionen wie Lesen, Erstellen, Bearbeiten, Loeschen, Freigeben, Exportieren verwenden.
   - Kein Premium-Feature durch `admin` implizieren.
   - Admin darf Feature-/Billing-Konfiguration verwalten, aber Featurezugriff kommt aus Entitlements.

4. Feature Checks ersetzen:
   - `hasLicensedFeature`, `getEnabledFeatures(plan)`, Pro-Profile und Premium-UI-Flags schrittweise auf neue Feature-Flag-/Marketplace-Quelle mappen.
   - `teamUsers`, `apiAccess`, `datevExport`, `financeAutomation` etc. als Feature Flags definieren.

5. Seat-Limit migrieren:
   - `getUserLimitStatus`, `assertCanCreateUser`, User-Service und DB-Trigger auf neue Seat-Quelle vorbereiten.
   - DB-Trigger erst spaeter ersetzen oder kompatibel erweitern, weil er aktuell direkte Datenintegritaet erzwingt.

6. APIs versionieren:
   - Neue Billing-/Marketplace-APIs additiv anlegen.
   - Alte `/api/settings/license/*` in Phase 3 nur als Compatibility/Activation-Fallback nutzen.

7. Tests erweitern:
   - Entitlement Compatibility Tests.
   - Migration Shadow-Write Tests.
   - Rollen duerfen keine Premium-Features freischalten.
   - Seat-Limits aus neuer Quelle plus Fallback auf alte Lizenz.

## 7. Risikoanalyse

- Hoch: DB-Trigger `enforce_user_license_limit` nutzt direkt `License.maxUsers`. Eine unkoordinierte Migration kann Useranlage/-aktivierung produktiv blockieren.
- Hoch: Lizenz-Keys benoetigen `LICENSE_PUBLIC_KEY` und Key-Erzeugung `LICENSE_PRIVATE_KEY`. Falsche Env-Konfiguration macht Aktivierung/Generierung unbrauchbar.
- Hoch: `License.keyHash` und `LicenseIssue.keyHash` sind Unique-Keys. Migration darf keine Hash-Kollisionen oder doppelte Shadow-Writes erzeugen.
- Mittel: `admin` ist aktuell sowohl Verwaltungsrolle als auch Vollberechtigungsrolle. Wenn Featurezugriff entfernt wird, muessen Admin-Verwaltung und Premium-Nutzung getrennt getestet werden.
- Mittel: Alte Planliste enthaelt `pro`, `team`, `unlimited`; Phase-1-Zielplaene enthalten nur `Free`, `Starter`, `Business`, `Enterprise`. Mapping muss explizit sein.
- Mittel: Desktop, Pro-Desktop, Web-Pro und Server-Core nutzen Package-Entitlements. Eine reine Web-Migration wuerde diese Profile sonst divergieren lassen.
- Mittel: UI hat mehrere Lizenz-Key-Einstiegspunkte. Nutzerfuehrung muss spaeter vereinheitlicht werden, ohne Aktivierungsfallback zu verlieren.
- Niedrig bis mittel: Viele `Premium`-Vorkommen sind Branding/UI-Texte, nicht Lizenzlogik. Automatische Bulk-Migration nach String-Suche waere riskant.

## 8. Phase-1-Schutz

Die neue Phase-1-Struktur bleibt additiv:

- `apps/web/src/lib/saas-license-architecture.ts`
- `apps/web/src/app/dashboard-v2/settings/license-billing/**`
- `/dashboard-v2/settings/license-billing`

Diese Struktur soll in Phase 3 Ziel- und Navigationsanker bleiben. Alte Routen `/dashboard-v2/license`, `/dashboard-v2/license-admin` und `/dashboard-v2/settings/license` bleiben bis zur abgeschlossenen Migration als Fallback bestehen.
