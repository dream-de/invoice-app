export const automationConfig = {
  key: "automation",
  title: "Automatisierung & Workflows",
  description: "Workflows, wiederkehrende Rechnungen, Zahlungserinnerungen und Mahnwesen.",
  status: "active",
  settingsSource: "apps/web/src/modules/automation/config.ts",
  api: "/api/automation/workflows",
  plannedSections: [
    "Wiederkehrende Rechnungen: taeglich, woechentlich, monatlich, jaehrlich, benutzerdefiniert",
    "Zahlungserinnerungen: vor Faelligkeit, am Faelligkeitstag, nach Faelligkeit",
    "Mahnwesen: Mahnstufe 1, Mahnstufe 2, Mahnstufe 3",
    "Workflow Regeln: bezahlt, ueberfaellig, Projekt abgeschlossen"
  ]
} as const;
