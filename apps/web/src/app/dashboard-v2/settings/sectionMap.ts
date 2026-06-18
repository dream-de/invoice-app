import { premiumSettingsNav, settingsNav } from "@/lib/settings-nav"

export const premiumSettingsSections = premiumSettingsNav

export type PremiumSettingsSection = Exclude<(typeof settingsNav)[number]["key"], "categories">

export function isPremiumSettingsSection(value: string): value is PremiumSettingsSection {
  return premiumSettingsSections.some((section) => section.key === value)
}
