export type PremiumNavigationArea =
  | "dashboard"
  | "license-billing"
  | "marketplace"
  | "feature-flags"
  | "premium-settings"
  | "premium-apis"

export type PremiumNavigationTarget = {
  key: PremiumNavigationArea
  label: string
  href: string
  description: string
}

export const premiumNavigationTargets: readonly PremiumNavigationTarget[] = [
  {
    key: "dashboard",
    label: "Dashboard V2",
    href: "/dashboard-v2",
    description: "Premium Workspace und operative Premium-Ansichten."
  },
  {
    key: "license-billing",
    label: "Lizenz & Abrechnung",
    href: "/dashboard-v2/settings/license-billing",
    description: "Plan, Seats, Limits, Rechnungen und erweiterte Aktivierung."
  },
  {
    key: "marketplace",
    label: "Marketplace",
    href: "/dashboard-v2/settings/license-billing/marketplace",
    description: "Premium-Erweiterungen und Marketplace-Kategorien."
  },
  {
    key: "feature-flags",
    label: "Feature Flags",
    href: "/dashboard-v2/settings/license-billing/usage-limits",
    description: "Zentrale Feature-Pruefung und Limits fuer neue SaaS-Architektur."
  },
  {
    key: "premium-settings",
    label: "Premium Settings",
    href: "/dashboard-v2/settings",
    description: "Premium-vorbereitete Settings-Sektionen und Rollen-/Berechtigungsgrenzen."
  },
  {
    key: "premium-apis",
    label: "Premium APIs",
    href: "/dashboard-v2/settings/api",
    description: "API Premium und alte Lizenz-/Premium-API-Kompatibilitaet."
  }
]
