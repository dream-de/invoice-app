export const analyticsConfig = {
  key: "analytics",
  title: "Berichte & Analytics",
  description: "Umsatz-, Rechnungs-, Kunden-, Projekt- und Zeiterfassungsberichte mit Exportvorbereitung.",
  status: "active",
  settingsSource: "apps/web/src/modules/analytics/config.ts",
  api: "/api/analytics/reports",
  plannedSections: [
    "Umsatzberichte: Heute, Woche, Monat, Jahr",
    "Rechnungsberichte: Offen, Bezahlt, Ueberfaellig, Storniert",
    "Kundenberichte: Top Kunden, Umsatz pro Kunde, offene Betraege",
    "Projektberichte: Stunden, Umsatz, Rentabilitaet",
    "Zeiterfassung: gebuchte, fakturierte und offene Stunden",
    "Export vorbereitet: PDF, Excel, CSV"
  ]
} as const;
