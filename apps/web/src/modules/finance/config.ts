export const financeConfig = {
  key: "finance",
  title: "Finance",
  description: "Vorbereitung fuer Zahlungs-, Banken- und Abstimmungsfunktionen ohne aktive Provider-Anbindung.",
  status: "planned",
  settingsSource: "apps/web/src/modules/finance/config.ts",
  plannedSections: [
    "Bankkonten",
    "Zahlungsarten",
    "PayPal",
    "Stripe",
    "Open Banking",
    "finAPI Client ID / Secret / Webhook",
    "Bankverbindungen",
    "BankAccounts",
    "BankTransactions",
    "Zahlungsabgleich",
  ],
  openBanking: {
    provider: "finapi",
    region: "Deutschland / EU",
    activeConnection: false,
    storesBankCredentials: false,
    preparedAreas: ["Bankverbindungen", "Konten", "Zahlungsabgleich", "Synchronisation", "Token-Verwaltung", "Audit Log"]
  }
} as const;
