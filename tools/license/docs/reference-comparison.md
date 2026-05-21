# Referenz-Abgleich

Dieser Abgleich ist eine lokale Roadmap. Ziel ist nicht blindes Kopieren, sondern
die Invoice-App Schritt fuer Schritt stabil und professionell fertigzustellen.

## Bereits stark umgesetzt

- Dokumenten-Editor mit linker Bearbeitung und rechter DIN-A4-Vorschau
- Vorlagen-Editor mit linker Werkzeugleiste, Canvas und rechter Eigenschaften-Spalte
- Eigenschaften/Ebenen-Struktur im Vorlagen-Editor
- PDF-Export ueber echte Vorlage
- Spracheinstellung mit Deutsch/Englisch und i18n-Grundstruktur
- Dashboard-Schnellaktionen
- Dream-Invoice Branding

## Noch wichtig fuer eine echte App

1. PDF-Export komplett durchziehen
   - alle Dokumenttypen pruefen: Rechnung, Angebot, Auftrag, Lieferschein, Gutschrift
   - Dateinamen, Statusmeldungen und Fehlerfaelle vereinheitlichen

2. E-Mail Versand fertigstellen
   - SMTP-Einstellungen nutzen
   - PDF automatisch anhaengen
   - Versandstatus speichern

3. Kunden, Projekte, Artikel tiefer verbinden
   - echte Auswahl statt Demo-Werte
   - Positionen aus Artikeln uebernehmen
   - Projektbezug auf Dokumenten speichern

4. Vorlagen produktionsreif machen
   - Standard Rechnung
   - Klassische Warenrechnung
   - Angebotsvorlage
   - Pflichtangaben-Check

5. Lizenz und Rollen sauber finalisieren
   - Lizenzstatus anzeigen
   - Nutzerlimits pruefen
   - Berechtigungen pro Rolle testen

6. Demo erst am Ende
   - Demo-Daten kontrolliert seedbar machen
   - Demo-Modus von echter App trennen
   - keine Demo-Logik in produktive Workflows mischen

## Struktur-Entscheidung

Der feste Tools-Bereich bleibt:

```txt
tools/
  Lizenz/
```

Weitere Tool-Bereiche duerfen spaeter daneben entstehen, aber Lizenzdetails
bleiben in `tools/Lizenz`.
