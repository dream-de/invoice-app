# Audit Log

## Vorbereitete Ereignisse

- Login: `auth.login`
- Logout: `auth.logout`
- Benutzeranlage: `user.create`
- Benutzerloeschung: `user.delete`
- Rechnung erstellt/finalisiert: `invoice.finalize`
- Rechnung geloescht: `invoice.delete`
- Einstellungen geaendert: `settings.*.update`

## Uebersicht

Die Admin-Seite `/dashboard-v2/audit-log` liest bestehende AuditLog-Eintraege und bietet Basisfilter nach Datum und Benutzer-Suchbegriff. Der Benutzerfilter sucht in Aktion, Objekt, Referenz, Grund, Daten und Metadaten.

## Erweiterung

Fuer vollstaendige Benutzerzuordnung sollte spaeter ein explizites `userId`-Feld am AuditLog-Modell ergaenzt werden. Phase 20 veraendert das Datenmodell bewusst nicht.
