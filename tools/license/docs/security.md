# Lizenz Sicherheit

## Niemals ins Repository

- Private Keys
- echte Lizenzschluessel von Kunden
- echte Kundendaten
- Produktions-Secrets
- `.env` Dateien mit sensiblen Werten

## Erlaubt im Repository

- oeffentliche Prueflogik
- Beispiel-Payloads ohne echte Daten
- Dokumentation
- Testdaten
- Generator-Skript ohne Private Key

## Signatur-Regel

Der private Key erstellt die Lizenz. Die App prueft mit dem oeffentlichen Key.
Dadurch kann eine Lizenz nicht einfach im Browser oder in der Datenbank gefaelscht
werden.

## Repository-Regel

Vor einer Veroeffentlichung pruefen:

- keine privaten Keys
- keine echten Kundendaten
- keine echten IBANs oder E-Mails
- keine lokalen Server-Pfade mit Secrets
- keine Archive mit sensiblen Inhalten

## Empfehlung

Lizenz-Tools bleiben im Repository, Secrets bleiben ausserhalb. So kann spaeter
jeder die App bauen, ohne private Produktionsdaten zu sehen.
