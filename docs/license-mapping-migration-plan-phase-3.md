# Lizenzmigration Phase 3: Mapping zu Plan + Marketplace + Feature Flags

Stand: 2026-06-24
Branch: dev/dreaminvoice-premium

## Ziel

Diese Phase bereitet Mapping und Migrationslogik vor. Es wurde nichts geloescht, keine Datenbankfelder entfernt, keine APIs entfernt und keine Premium-Rollen entfernt.

Backup vor Start:

- `/opt/invoice-app/backups/phase3-license-mapping-20260624-165806/`
- Enthalten: `repo.bundle`, `HEAD.txt`, `status.txt`, `worktree.diff`, `project.tar.gz`

## Neues Zielmodell

### Plan

- Free
- Starter
- Business
- Enterprise

### Feature Flags

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

### Marketplace-Erweiterungen

| Kategorie | Erweiterungen |
| --- | --- |
| Finanzen | DATEV, Banking, PayPal, Stripe |
| KI | KI Assistent, OCR KI, Dokumentanalyse |
| E-Commerce | Shopify, WooCommerce |
| Projektmanagement | Zeiterfassung Pro, Ressourcenplanung |
| Produktion | Lagerverwaltung, Inventur |
| Business | Multi-Mandanten, API Premium, Kundenportal Pro |

## Mapping-Artefakte

- `apps/web/src/lib/saas-license-migration.ts`
  - `newFeatureFlags`
  - `newMarketplaceExtensions`
  - `legacyPremiumFunctionMappings`
  - `mapLegacyLicenseToSaasEntitlements()`
- `apps/web/src/lib/saas-license-migration.test.ts`
  - prueft Feature-Flag-Liste
  - prueft Beispiel `premium_license = true -> business + ocr/datev/api_premium`
  - prueft Package-Feature-Mapping

## Vollstaendige Mapping-Tabelle Alt -> Neu

| Alt-Funktion | Aktueller Mechanismus | APIs | Rollen | DB-Felder | UI | Zielplan | Feature Flags | Marketplace | Migration |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `premium_license` | Aktive `License` oder signierter `INV1` Key | `/api/settings/license/activate`, `/api/settings/license/verify`, `/api/settings/users` | `admin` | `License.keyHash`, `License.plan`, `License.maxUsers`, `License.features` | `PremiumLicensePanel`, `LicenseActivationForm` | Business | `feature.ocr`, `feature.datev`, `feature.api_premium` | OCR KI, DATEV, API Premium | Ja |
| `license_key` | Signierter Compact Key oder JSON Envelope | `/api/settings/license/*` | `admin`, License Admin Owner | `LicenseIssue.*`, `License.*` | `PremiumLicenseAdminPage`, Lizenzformulare | Business | `feature.api_premium` | API Premium | Ja |
| `premium_role/admin` | `admin` als Gate und Vollberechtigung | `/api/settings/license/*`, `/api/settings/users` | `admin`, Legacy `owner` | `User.role`, `UserPermission.*` | Navigation, Users UI | Free | keine | keine | Ja, Entkopplung |
| `datevExport` | Package-Entitlement und Finance/Report Export | `/api/finance/datev-export`, `/api/finance/report` | `finance:view`, Admin-Pfade | `License.features`, `Invoice`, `Expense` | Reports, Finance | Business | `feature.datev` | DATEV | Ja |
| `financeAutomation` | Open Banking/finAPI und Banking-Workflow | `/api/finance/open-banking/*`, `/api/finance/base` | `finance:view`, `settings:manage` | `BankAccount`, `BankTransaction`, `PaymentProviderConfig` | Finance Panel, Finance Settings | Business | `feature.banking` | Banking | Ja |
| PayPal/Stripe | Payment Provider Configs und Payment Links | `/api/invoice/payment-links/[id]`, `/api/payments/webhooks/paypal`, `/api/payments/webhooks/stripe` | `finance:view`, `settings:manage` | `PaymentProviderConfig`, `InvoicePaymentLink`, `InvoicePayment` | Integrations/Finance UI | Starter | `feature.banking` | PayPal, Stripe | Ja |
| `apiAccess` | Package-Entitlement und API-Settings | `/api/v1/*`, `/api/api-center` | `admin`, `api:manage` | `ApiKey.keyHash`, `ApiKey.scopes`, `License.features` | API Settings | Business | `feature.api_premium` | API Premium | Ja |
| `multiCompany` | Package-Entitlement, Tenant/Company-Struktur | `/api/tenants`, `/api/companies`, `/api/company-locations` | `admin`, `UserCompanyMembership.role` | `Tenant`, `Company`, `UserCompanyMembership` | Tenants/Companies/Locations | Enterprise | `feature.multitenant` | Multi-Mandanten | Ja |
| `teamUsers` | `License.maxUsers`, Service und DB-Trigger | `/api/settings/users` | `admin` | `License.maxUsers`, `User.status`, DB-Trigger | Users, Seats, License Panel | Business | keine, Seat-Entitlement | keine | Ja |
| OCR | OCR Package, Belegupload, OCR Dialoge | `/api/expenses/attachments/upload`, `/api/import/*` | `documents:view`, `finance:view` | `ExpenseAttachment`, `DocumentAsset` | Expense OCR, Document OCR, Invoice OCR | Business | `feature.ocr` | OCR KI | Ja |
| KI Assistent | AI Assistant UI und API | `/api/ai-assistant/*` | Dashboard/Admin-Zugriff | keine dedizierte Lizenzspalte | AI Assistant | Business | `feature.ai_assistant` | KI Assistent | Ja |
| Dokumentanalyse | DMS/OCR/Analysevorbereitung | `/api/document-management/*`, `/api/documents/export` | `documents:view`, `documents:pdf` | `DocumentAsset` | Dokumentenmanagement | Business | `feature.document_ai` | Dokumentanalyse | Ja |
| Kundenportal | Portal-App und Portal Settings | `/api/portal/*` | `portal:offer`, `archive:use`, `settings:manage` | Portal-/Customer-/Invoice-Daten | Portal Settings, Share Dialog | Business | `feature.portal_pro` | Kundenportal Pro | Ja |
| Zeiterfassung | Time/Time-Tracking Workflows | `/api/time/create`, `/api/time-tracking/*` | `projects:view`, `documents:create` | `TimeEntry`, `Project`, `Invoice` | Time Views | Starter | `feature.time_pro` | Zeiterfassung Pro | Ja |
| Ressourcenplanung | Projekt-/Teamdaten vorbereitet | `/api/projects/*`, `/api/settings/users` | `projects:view`, `users:manage` | `Project`, `User` | Projects UI | Business | `feature.resource_planning` | Ressourcenplanung | Nein, neu |
| Shopify/WooCommerce | Integrationsbereich vorbereitet | `/api/templates`, `/api/api-center` | `settings:manage`, `api:manage` | `IntegrationConnection`, `ApiKey` | Integrations/Marketplace | Business | `feature.shopify`, `feature.woocommerce` | Shopify, WooCommerce | Nein, neu |
| Lager/Inventur | Artikel/Kategorien als Basis | `/api/articles/*` | `articles:view`, `articles:edit` | `Article`, `Category` | Articles UI | Business | `feature.warehouse`, `feature.inventory` | Lagerverwaltung, Inventur | Nein, neu |

## Kompatibilitaetsregel fuer bestehende Kunden

Bestehende Kunden duerfen keine Funktionen verlieren.

Beispiel:

```txt
premium_license = true
```

wird vorbereitet als:

```txt
plan = business
feature.ocr = true
feature.datev = true
feature.api_premium = true
marketplace = OCR KI, DATEV, API Premium
```

Ein gueltiger `license_key` bleibt akzeptiert. Die neue Mapping-Funktion erzeugt daraus zunaechst nur eine neue Entitlement-Sicht; sie schreibt noch keine neuen Datenbankfelder.

## Betroffene APIs

- `/api/settings/license/activate`
- `/api/settings/license/verify`
- `/api/settings/license/generate`
- `/api/settings/users`
- `/api/premium/actions`
- `/api/finance/datev-export`
- `/api/finance/report`
- `/api/finance/open-banking/*`
- `/api/finance/base`
- `/api/invoice/payment-links/[id]`
- `/api/payments/webhooks/paypal`
- `/api/payments/webhooks/stripe`
- `/api/v1/*`
- `/api/api-center`
- `/api/tenants`
- `/api/companies`
- `/api/company-locations`
- `/api/expenses/attachments/upload`
- `/api/import/*`
- `/api/ai-assistant/*`
- `/api/document-management/*`
- `/api/portal/*`
- `/api/time/create`
- `/api/time-tracking/*`
- `/api/projects/*`
- `/api/articles/*`

## Betroffene Datenbankfelder

- `User.role`
- `User.status`
- `UserPermission.scope`
- `UserPermission.action`
- `UserPermission.allowed`
- `License.keyHash`
- `License.plan`
- `License.billingCycle`
- `License.maxUsers`
- `License.status`
- `License.company`
- `License.validUntil`
- `License.features`
- `License.activatedAt`
- `LicenseIssue.licenseId`
- `LicenseIssue.keyHash`
- `LicenseIssue.keyPreview`
- `LicenseIssue.plan`
- `LicenseIssue.billingCycle`
- `LicenseIssue.maxUsers`
- `LicenseIssue.status`
- `LicenseIssue.features`
- `LicenseIssue.activatedAt`
- `Tenant`, `Company`, `CompanyLocation`, `UserCompanyMembership.role`
- `ApiKey.keyHash`, `ApiKey.scopes`
- `IntegrationConnection.provider`, `IntegrationConnection.config`
- `PaymentProviderConfig`, `InvoicePaymentLink`, `InvoicePayment`
- `BankAccount`, `BankTransaction`
- `DocumentAsset`, `ExpenseAttachment`
- `TimeEntry`, `Project`, `Article`, `Category`
- DB-Trigger `enforce_user_license_limit`

## Risikoanalyse

- Hoch: `License.maxUsers` und DB-Trigger blockieren aktive User. Seat-Migration muss zuerst kompatibel lesen, nicht direkt ersetzen.
- Hoch: License-Key-Aktivierung ist sicherheitskritisch und haengt an `LICENSE_PUBLIC_KEY`/`LICENSE_PRIVATE_KEY`.
- Hoch: `admin` darf nicht unbemerkt Premium-Funktionen behalten, muss aber Verwaltungsrechte behalten.
- Hoch: DATEV, Banking, API und Multi-Mandanten sind geschäftskritisch und duerfen bei Bestandskunden nicht deaktiviert werden.
- Mittel: PayPal/Stripe haben kein eigenes Feature-Flag in der vorgegebenen Liste; Phase 3 mappt sie auf Marketplace-Erweiterungen und `feature.banking`.
- Mittel: Package-Entitlements in Desktop/Web-Pro/Server-Core koennen von Web-Migration divergieren, wenn kein gemeinsamer Compatibility Layer entsteht.
- Mittel: OCR/KI/Dokumentanalyse sind teilweise vorbereitet statt voll produktiv; Migration muss zwischen vorhandener Funktion und geplanter Erweiterung unterscheiden.
- Niedrig: Shopify/WooCommerce, Lager und Inventur sind vor allem neue Marketplace-Vorbereitungen ohne kritische Altfreischaltung.

## Vorschlag fuer Phase 4: Kompatibilitaetsschicht

1. `getSaasEntitlementsForCurrentTenant()` einfuehren.
2. Neue Entitlement-Sicht zuerst aus neuer SaaS-Struktur lesen.
3. Wenn keine neue Struktur vorhanden ist, `mapLegacyLicenseToSaasEntitlements()` als Fallback verwenden.
4. Alte License APIs unveraendert lassen, aber Response optional um neue Entitlement-Sicht ergaenzen.
5. Feature-Check-Helper bereitstellen:
   - `hasFeatureFlag("feature.datev")`
   - `hasMarketplaceExtension("datev")`
   - `getCurrentPlan()`
6. Rollenchecks nur fuer Berechtigungen verwenden.
7. Tests: Bestandskunde mit `premium_license`, gueltigem `license_key`, `admin`-Rolle und alter `License.features` verliert keine Funktion.

## Vorschlag fuer Phase 5: Migration

1. Neue DB-Tabellen/Felder additiv anlegen:
   - Plan Subscription
   - Marketplace Installations
   - Feature Flag Assignments
   - Seat Allocation
2. Backfill aus `License`, `LicenseIssue`, `License.features`, `License.maxUsers`.
3. Shadow-Read aktivieren und Alt/Neu-Ergebnis vergleichen.
4. Admin-/Rollen-Freischaltung aus Featurezugriff entfernen.
5. DB-Trigger fuer User-Limit kompatibel erweitern oder durch neue Seat-Quelle ersetzen.
6. License APIs als Legacy Activation Fallback behalten.
7. Nach Monitoring alte direkte Abhaengigkeiten in UI und Services schrittweise abbauen.
