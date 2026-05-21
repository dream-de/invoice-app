# Lizenzmodell

## Ziel

Die Lizenz prueft lokal, welche Funktionen und Limits fuer eine Installation
aktiv sind. Die App soll auch dann kontrolliert reagieren, wenn keine Lizenz
aktiviert wurde.

## Plaene

| Plan | Nutzer | Zweck |
| --- | ---: | --- |
| free | 5 | Lokale Tests und einfache Demo |
| starter | 10 | Kleine Teams |
| team | 25 | Wachsende Teams |
| business | 50 | Agenturen und Firmen |
| enterprise | 100 | Groessere Organisationen |
| unlimited | unbegrenzt | Individuelle Lizenz |

## Lizenz-Felder

| Feld | Bedeutung |
| --- | --- |
| `version` | Lizenzformat-Version |
| `licenseId` | Eindeutige Lizenz-ID |
| `plan` | Aktiver Plan |
| `maxUsers` | Nutzerlimit |
| `billingCycle` | `monthly`, `yearly` oder `custom` |
| `issuedAt` | Ausstellungsdatum |
| `validUntil` | Ablaufdatum oder leer bei unbegrenzt |
| `customerName` | Anzeigename des Kunden |

## Grundregel

Die App vertraut nicht auf editierbare Client-Daten. Eine Lizenz ist nur gueltig,
wenn die Signatur serverseitig erfolgreich geprueft wurde.
