"use client"

import type { ReactNode } from "react"
import { NavigationShell } from "@invoice-platform/ui"
import { useLanguage } from "@/lib/i18n"

export function LocalizedNavigationShell({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage()
  const isEnglish = language === "en"

  const navigationItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "⌂" },
    { href: "/customers", label: t("nav.customers"), icon: "♙" },
    { href: "/projects", label: t("nav.projects"), icon: "◇" },
    { href: "/documents", label: t("nav.documents"), icon: "□" },
    { href: "/finance", label: t("nav.finance"), icon: "⌁" },
    { href: "/articles", label: t("nav.articles"), icon: "▣" }
  ]

  return (
    <NavigationShell
      title="Dream Invoice"
      items={navigationItems}
      variant="light"
      searchLabel={isEnglish ? "Search" : "Suchen"}
      settingsLabel={isEnglish ? "Settings" : "Einstellungen"}
      notificationsLabel={isEnglish ? "Notifications" : "Benachrichtigungen"}
    >
      {children}
    </NavigationShell>
  )
}
