export const premiumSettingsSections = [
  { key: "company", title: "Unternehmen", href: "/dashboard-v2/settings/company" },
  { key: "finance", title: "Finanzen", href: "/dashboard-v2/settings/finance" },
  { key: "documents", title: "Dokumente", href: "/dashboard-v2/settings/documents" },
  { key: "time-tracking", title: "Zeiterfassung", href: "/dashboard-v2/settings/time-tracking" },
  { key: "billing", title: "Fakturierung", href: "/dashboard-v2/settings/billing" },
  { key: "email", title: "E-Mail", href: "/dashboard-v2/settings/email" },
  { key: "users", title: "Benutzer & Rollen", href: "/dashboard-v2/settings/users" },
  { key: "security", title: "Sicherheit", href: "/dashboard-v2/settings/security" },
  { key: "audit-logs", title: "Audit Logs", href: "/dashboard-v2/settings/audit-logs" },
  { key: "license", title: "Lizenzverwaltung", href: "/dashboard-v2/settings/license" },
  { key: "integrations", title: "Integrationen", href: "/dashboard-v2/settings/integrations" },
  { key: "reports", title: "Berichte", href: "/dashboard-v2/settings/reports" },
  { key: "archive", title: "Archiv", href: "/dashboard-v2/settings/archive" },
  { key: "system", title: "System", href: "/dashboard-v2/settings/system" },
  { key: "automation", title: "Automatisierung", href: "/dashboard-v2/settings/automation" },
  { key: "legal", title: "Rechtliches", href: "/dashboard-v2/settings/legal" },
  { key: "notifications", title: "Benachrichtigungen", href: "/dashboard-v2/settings/notifications" },
  { key: "reminders", title: "Erinnerungen", href: "/dashboard-v2/settings/reminders" },
  { key: "number-ranges", title: "Nummernkreise", href: "/dashboard-v2/settings/number-ranges" },
  { key: "add-ons", title: "API & Webhooks", href: "/dashboard-v2/settings/add-ons" },
  { key: "portal", title: "Portal", href: "/dashboard-v2/settings/portal" }
] as const

export type PremiumSettingsSection = (typeof premiumSettingsSections)[number]["key"]

export function isPremiumSettingsSection(value: string): value is PremiumSettingsSection {
  return premiumSettingsSections.some((section) => section.key === value)
}
