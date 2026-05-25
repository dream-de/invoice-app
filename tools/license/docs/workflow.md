# Lizenz Workflow

## 1. Lizenz erstellen

Ein privater Signatur-Key wird nur lokal oder in einer sicheren CI/Server-Umgebung
gesetzt. Er wird niemals in Git gespeichert.

Beispiel:

```sh
LICENSE_PRIVATE_KEY="..." node tools/license/generate-license-key.mjs --plan=pro --billing=yearly --days=365 --customer="Demo Kunde"
```

## 2. Lizenz aktivieren

Die App sendet den Lizenzschluessel an:

```txt
POST /api/settings/license/activate
```

Der Server prueft:

- Format
- Signatur
- Ablaufdatum
- Plan
- Nutzerlimit

## 3. Lizenz speichern

Nach erfolgreicher Pruefung wird nur der sichere Lizenzstatus gespeichert:

- Plan
- Status
- Max. Nutzer
- Gueltig bis
- aktivierte Features

## 4. Lizenz verwenden

Die UI liest nur freigegebene Lizenzinformationen. Kritische Entscheidungen
bleiben serverseitig.

## 5. Spaetere Erweiterung

Moegliche naechste Schritte:

- Lizenz-Status sichtbar in den Systemeinstellungen anzeigen
- Lizenzlimits bei Nutzerverwaltung pruefen
- Feature-Flags pro Plan definieren
- Lizenz erneuern oder deaktivieren
