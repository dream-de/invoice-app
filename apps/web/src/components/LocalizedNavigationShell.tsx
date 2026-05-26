"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { NavigationShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type ShellUser = {
  id: string
  email: string
  name: string | null
  role: string
  status: string
}

function isShellUser(value: unknown): value is ShellUser {
  if (typeof value !== "object" || value === null) return false
  const user = value as Record<string, unknown>
  return typeof user.id === "string" && typeof user.email === "string" && typeof user.role === "string"
}

export function LocalizedNavigationShell({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const currentPathname = pathname ?? ""
  const { language, t } = useLanguage()
  const isEnglish = language === "en"
  const [currentUser, setCurrentUser] = useState<ShellUser | null>(null)

  const isLoginPage = currentPathname === "/login" || currentPathname.startsWith("/login/")

  useEffect(() => {
    if (isLoginPage) {
      setCurrentUser(null)
      return
    }

    let cancelled = false

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (!cancelled) setCurrentUser(isShellUser(result?.user) ? result.user : null)
      } catch {
        if (!cancelled) setCurrentUser(null)
      }
    }

    loadCurrentUser()

    return () => {
      cancelled = true
    }
  }, [currentPathname, isLoginPage])

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    router.push("/login")
    router.refresh()
  }, [router])

  const navigationItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "⌂" },
    { href: "/customers", label: t("nav.customers"), icon: "♙" },
    { href: "/projects", label: t("nav.projects"), icon: "◇" },
    { href: "/documents", label: t("nav.documents"), icon: "□" },
    { href: "/finance", label: t("nav.finance"), icon: "⌁" },
    { href: "/articles", label: t("nav.articles"), icon: "▣" }
  ]

  if (isLoginPage) return <>{children}</>

  return (
    <NavigationShell
      title="Dream Invoice"
      items={navigationItems}
      variant="light"
      searchLabel={isEnglish ? "Search" : "Suchen"}
      settingsLabel={isEnglish ? "Settings" : "Einstellungen"}
      notificationsLabel={isEnglish ? "Notifications" : "Benachrichtigungen"}
      currentUser={currentUser}
      profileLabel={isEnglish ? "User menu" : "Benutzermenue"}
      logoutLabel={isEnglish ? "Sign out" : "Abmelden"}
      onLogout={handleLogout}
    >
      {children}
    </NavigationShell>
  )
}
