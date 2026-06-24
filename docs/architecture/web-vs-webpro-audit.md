# Web vs Web-Pro Architektur-Audit

Datum: 2026-06-24
Branch: dev/dreaminvoice-premium
Status: Analyse, keine Migration, kein Deploy
Backup: /opt/invoice-app/backups/web-vs-webpro-audit-20260624-172856/

## Ergebnis

Die aktuell aktive Anwendung auf Port 3012 ist die Docker-Anwendung aus dem Image `ghcr.io/dream-de/invoice-app:latest`. Der Container `dream-invoice-web-app-1` mappt Host-Port 3012 auf Container-Port 3010 und startet:

```text
pnpm --filter @dream-invoice/web exec next start -H 0.0.0.0 -p 3010
```

Damit laeuft aktuell `@dream-invoice/web`, nicht `@dream-invoice/web-pro`.

Der Docker-Build verwendet ebenfalls `@dream-invoice/web`:

```text
RUN pnpm --filter @dream-invoice/web build
CMD ["pnpm", "--filter", "@dream-invoice/web", "exec", "next", "start", "-H", "0.0.0.0", "-p", "3010"]
```

`docker-compose.yml` veroeffentlicht den internen Port 3010 ueber `${WEB_PORT:-3010}:3010`. In der aktiven Umgebung ist `WEB_PORT=3012` gesetzt, daher ist die App unter Port 3012 erreichbar.

## Docker und Runtime

| Frage | Befund |
| --- | --- |
| Welche App wird von Docker gebaut? | `@dream-invoice/web` |
| Welche App laeuft auf Port 3012? | Container `dream-invoice-web-app-1`, intern `@dream-invoice/web` auf Port 3010 |
| Nutzt `docker/Dockerfile` `web` oder `web-pro`? | Ausschliesslich `@dream-invoice/web` |
| Gibt es einen Docker-Pfad fuer `web-pro`? | Nein |
| Ist `web-pro` aktuell runtime-faehig? | Nein, aktuell kein Next.js-App-Entrypoint |

## Unterschied apps/web vs apps/web-pro

### apps/web

`apps/web` ist die vollstaendige produktive Next.js-Anwendung. Sie enthaelt:

- Next.js App Router Seiten und API-Routen
- Dashboard-v2 inklusive PremiumWorkspace und Premium-Unterseiten
- klassische Settings- und Benutzerverwaltungsseiten
- Lizenzaktivierung, Lizenzverwaltung und Lizenz-Key-APIs
- neue SaaS-Strukturen aus Phase 1 bis 4
- Auth-, Benutzer-, Permission-, Feature-Flag- und Lizenz-Integrationen
- Docker-Build- und Runtime-Ziel

### apps/web-pro

`apps/web-pro` ist derzeit nur ein kleines TypeScript-Paket:

- `apps/web-pro/package.json`
- `apps/web-pro/src/index.ts`
- `apps/web-pro/tsconfig.json`

Der einzige produktive Inhalt ist ein Profil-Export:

```ts
export const webProAppProfile = {
  id: "web-pro",
  label: "Dream Invoice Web Pro",
  plan: "pro",
  planLabel: licensePlanLabels.pro,
  enabledFeatures: getEnabledFeatures("pro")
} as const
```

`apps/web-pro` hat keine Next.js-Abhaengigkeit, keine App-Routen, keine API-Routen, keine Dashboard-Seiten und keinen Docker-Startpfad. Es ist aktuell kein ersetzbarer Runtime-Client fuer `apps/web`.

## Premium-Code in apps/web

Premium-, Dashboard-v2-, Settings- und Lizenzcode liegt aktuell fast vollstaendig in `apps/web`. Das ist operativ derzeit notwendig, weil Docker nur `apps/web` baut und startet. Architekturbezogen liegt Premium-Code damit aber im Basis-Web-Client und nicht in einer sauberen Pro-Grenze.

Wichtige betroffene Bereiche:

### Dashboard-v2 und Premium-UI

- `apps/web/src/app/dashboard-v2/PremiumWorkspace.tsx`
- `apps/web/src/app/dashboard-v2/DashboardV2.module.css`
- `apps/web/src/app/dashboard-v2/page.tsx`
- `apps/web/src/app/dashboard-v2/*/page.tsx`
- `apps/web/src/app/dashboard-v2/settings/PremiumSettingsSectionContent.tsx`
- `apps/web/src/app/dashboard-v2/settings/sectionMap.ts`
- `apps/web/src/app/dashboard-v2/settings/license-billing/*`

### Lizenz- und Premium-APIs

- `apps/web/src/app/api/settings/license/activate/route.ts`
- `apps/web/src/app/api/settings/license/generate/route.ts`
- `apps/web/src/app/api/settings/license/verify/route.ts`
- `apps/web/src/app/api/premium/actions/route.ts`
- `apps/web/src/app/api/settings/users/route.ts`

### Lizenz-, SaaS- und Feature-Flag-Logik

- `apps/web/src/lib/license/activate.ts`
- `apps/web/src/lib/license/admin.ts`
- `apps/web/src/lib/license/issue.ts`
- `apps/web/src/lib/license/keys.ts`
- `apps/web/src/lib/license/limits.ts`
- `apps/web/src/lib/license/plans.ts`
- `apps/web/src/lib/license/settings.ts`
- `apps/web/src/lib/feature-flags/compatibility.ts`
- `apps/web/src/lib/saas-license-architecture.ts`
- `apps/web/src/lib/saas-license-migration.ts`
- `apps/web/src/lib/settings-nav.ts`

### Settings und Benutzer/Berechtigungen

- `apps/web/src/app/settings/users/LicenseActivationForm.tsx`
- `apps/web/src/app/settings/users/UsersAndPermissionsClient.tsx`
- `apps/web/src/app/settings/users/page.tsx`
- `apps/web/src/components/settings/PremiumSettingsShell.tsx`
- `apps/web/src/lib/auth/permissions.ts`
- `apps/web/src/lib/users/permissions.ts`
- `apps/web/src/lib/users/service.ts`

## Bewertung: Liegt Premium faelschlich in apps/web?

Ja, aus Zielarchitektur-Sicht liegt Premium aktuell im falschen Ownership-Bereich, sofern `apps/web` kuenftig der neutrale Basis-Client und `apps/web-pro` der Premium-Client sein soll.

Nein, aus aktueller Runtime-Sicht ist es nicht einfach ein Versehen: `apps/web-pro` ist noch keine lauffaehige App. Wuerde Premium-Code sofort nach `apps/web-pro` verschoben, waeren Port 3012, Docker-Build, Dashboard-v2 und Lizenzfluesse betroffen.

Die richtige Schlussfolgerung ist daher: Premium darf jetzt nicht hart verschoben werden. Zuerst muss `web-pro` eine klare technische Rolle bekommen.

## Empfehlung

Kurzfristig `apps/web` als aktive Runtime behalten. Phase 5 nicht auf Basis einer angenommenen `web-pro`-Runtime starten.

Mittelfristig Premium sauber aus `apps/web` herausloesen. Dafuer gibt es zwei tragfaehige Varianten:

1. `apps/web` bleibt die einzige Next.js-Runtime, Premium-Domain-Code wandert in gemeinsam nutzbare Pakete oder ein Pro-Modul. `apps/web-pro` wird ein Premium-Profil-/Modulpaket.
2. `apps/web-pro` wird zu einer echten Next.js-App ausgebaut. Docker, Compose, Healthchecks und Deployments werden erst nach Routing- und API-Paritaet auf `@dream-invoice/web-pro` umgestellt.

Empfohlen ist Variante 1 als naechster Schritt: erst Grenzen schaffen und Premium-Code extrahieren, ohne die produktive Runtime zu wechseln. Variante 2 kann spaeter folgen, wenn ein separater Pro-Client wirklich benoetigt wird.

## Konkreter Migrationsplan web -> web-pro

### Schritt 1: Ownership festlegen

- `apps/web`: Basis-Runtime, Login, Kernnavigation, gemeinsame Shell, nicht-premium Features
- `apps/web-pro`: Premium-Profil, Feature-Flag-Konfiguration, Premium-Module oder spaeter Pro-Runtime
- `packages/*`: gemeinsam genutzte Lizenz-, Feature-Flag-, Auth-, Datenbank- und Domainlogik

### Schritt 2: web-pro runtime-faehig oder modulfaehig machen

Vor Codeverschiebungen entscheiden:

- Wenn `web-pro` Runtime werden soll: Next.js, App Router, Layout, Auth, env, Docker-Target und Tests hinzufuegen.
- Wenn `web-pro` Modul bleiben soll: klare Exporte fuer Premium-Konfiguration, Feature-Flags, Marketplace-Erweiterungen und UI-Module definieren.

### Schritt 3: Pure Logik zuerst extrahieren

Aus `apps/web/src/lib` in ein gemeinsames Paket oder nach `apps/web-pro/src` verschieben, aber erst nach Import-Paritaet:

- SaaS-Architekturmodell
- Feature-Flag-Kompatibilitaet
- Lizenz-Mapping
- Plan-/Marketplace-Definitionen
- nicht-routegebundene Lizenz-Helfer

Kritische Einschraenkung: Alte Lizenzlogik und APIs bleiben aktiv, bis die Kompatibilitaetsschicht vollstaendig validiert ist.

### Schritt 4: Premium-UI entkoppeln

Dashboard-v2-Komponenten in route-unabhaengige Komponenten schneiden:

- `PremiumWorkspace`
- Premium Settings Sections
- License & Billing Unterseiten
- Marketplace/Plan/Feature-Flag Anzeigen

Danach koennen `apps/web` und `apps/web-pro` dieselben Komponenten importieren oder `apps/web-pro` kann eigene Routen darauf aufbauen.

### Schritt 5: API-Grenzen klaeren

Lizenz- und Premium-APIs duerfen nicht vorzeitig entfernt werden. Fuer eine saubere Migration:

- API-Handler in `apps/web` belassen, solange Docker `@dream-invoice/web` startet.
- Gemeinsame Service-Logik aus API-Routen herausziehen.
- Falls `web-pro` spaeter Runtime wird, API-Routen in `web-pro` replizieren oder per gemeinsamem Handler teilen.
- Aktivierung, Lizenz-Key-Verifikation und Premium-Fallbacks erst nach Paritaet umschalten.

### Schritt 6: Docker erst zuletzt umstellen

Erst wenn `web-pro` vollstaendig lauffaehig ist:

- `docker/Dockerfile` Build-Ziel von `@dream-invoice/web` auf `@dream-invoice/web-pro` aendern
- CMD entsprechend anpassen
- Compose/Healthcheck pruefen
- Port 3012 Smoke-Test durchfuehren
- Dashboard-v2, Settings, License & Billing, alte Aktivierung und neue Feature-Flags testen

### Schritt 7: Validierung

Vor jeder produktiven Umstellung pruefen:

- Build von `@dream-invoice/web`
- Build/Typecheck von `@dream-invoice/web-pro`
- Lizenz- und Feature-Flag-Tests
- API Smoke-Tests fuer Aktivierung, Verify, Generate und Premium Actions
- Browser-Smoke fuer `/dashboard-v2` und `/dashboard-v2/settings/license-billing`
- Rueckfallverhalten fuer bestehende Premium-Lizenzen und Premium-Rollen

## Dateien, die spaeter migriert oder entkoppelt werden muessen

Prioritaet 1, pure Logik:

- `apps/web/src/lib/saas-license-architecture.ts`
- `apps/web/src/lib/saas-license-migration.ts`
- `apps/web/src/lib/feature-flags/compatibility.ts`
- `apps/web/src/lib/license/*`

Prioritaet 2, API-Service-Grenzen:

- `apps/web/src/app/api/settings/license/*/route.ts`
- `apps/web/src/app/api/premium/actions/route.ts`
- `apps/web/src/app/api/settings/users/route.ts`

Prioritaet 3, UI:

- `apps/web/src/app/dashboard-v2/PremiumWorkspace.tsx`
- `apps/web/src/app/dashboard-v2/settings/license-billing/*`
- `apps/web/src/app/dashboard-v2/settings/PremiumSettingsSectionContent.tsx`
- `apps/web/src/components/settings/PremiumSettingsShell.tsx`
- `apps/web/src/app/settings/users/*`

Prioritaet 4, Runtime:

- `docker/Dockerfile`
- `docker-compose.yml`
- Root `package.json` Scripts
- Healthchecks und Port-Konfiguration

## Phase-5-Sperre

Dieses Audit startet keine Phase 5. Es wurden keine Dateien geloescht, keine Migration durchgefuehrt, keine API entfernt, keine Datenbankfelder entfernt und kein Deployment ausgefuehrt.
