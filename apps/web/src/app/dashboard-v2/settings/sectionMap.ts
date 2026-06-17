export const premiumSettingsSections = [
  { key: "company", title: "Unternehmen", href: "/dashboard-v2/settings/company", children: ["Profil", "Adresse", "Branding", "Standorte"] },
  { key: "finance", title: "Finanzen", href: "/dashboard-v2/settings/finance", children: ["Banking", "Zahlungsziele", "Steuern", "Mahnungen"] },
  { key: "documents", title: "Dokumente", href: "/dashboard-v2/settings/documents", children: ["Vorlagen", "Archiv", "Signaturen", "Nummernkreise"] },
  { key: "time-tracking", title: "Zeiterfassung", href: "/dashboard-v2/settings/time-tracking", children: ["Zeiten", "Wochenstunden", "Kalender", "Export"] },
  { key: "billing", title: "Fakturierung", href: "/dashboard-v2/settings/billing", children: ["Rechnungslogik", "Zahlungen", "Mahnwesen", "Standards"] },
  { key: "communication", title: "Kommunikation", href: "/dashboard-v2/settings/communication", children: ["E-Mail", "SMTP", "Signaturen", "Texte"] },
  { key: "users-roles", title: "Benutzer & Rollen", href: "/dashboard-v2/settings/users-roles", children: ["Benutzer", "Rollen", "Rechte", "Einladungen"] },
  { key: "security", title: "Sicherheit", href: "/dashboard-v2/settings/security", children: ["Account", "2FA", "Audit", "Backup"] }
] as const

export type PremiumSettingsSection = (typeof premiumSettingsSections)[number]["key"]

export function isPremiumSettingsSection(value: string): value is PremiumSettingsSection {
  return premiumSettingsSections.some((section) => section.key === value)
}
