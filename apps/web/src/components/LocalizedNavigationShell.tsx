"use client"

import type { ReactNode } from "react"
import { useCallback, useEffect, useRef, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { isUserRole } from "@dream-invoice/auth"
import { NavigationShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"
import { getEffectivePermissionKeys, type UserPermissionSetting } from "@/lib/users/permissions"

type ShellUser = {
  id: string
  email: string
  name: string | null
  role: string
  status: string
  permissions?: UserPermissionSetting[]
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
  const hasLoadedCurrentUser = useRef(false)

  const isLoginPage = currentPathname === "/login" || currentPathname.startsWith("/login/")
  const isPublicAuthPage = isLoginPage || currentPathname.startsWith("/api/auth/verify-email")

  useEffect(() => {
    if (isPublicAuthPage) {
      hasLoadedCurrentUser.current = false
      setCurrentUser(null)
      return
    }

    if (hasLoadedCurrentUser.current) return

    let cancelled = false

    async function loadCurrentUser() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (!cancelled) {
          setCurrentUser(isShellUser(result?.user) ? result.user : null)
          hasLoadedCurrentUser.current = true
        }
      } catch {
        if (!cancelled) {
          setCurrentUser(null)
          hasLoadedCurrentUser.current = false
        }
      }
    }

    loadCurrentUser()

    return () => {
      cancelled = true
    }
  }, [isPublicAuthPage])

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    setCurrentUser(null)
    router.push("/login")
    router.refresh()
  }, [router])

  const userRole = currentUser && isUserRole(currentUser.role) ? currentUser.role : null
  const permissionKeys = userRole
    ? getEffectivePermissionKeys(userRole, currentUser?.permissions ?? [])
    : new Set<string>()
  const can = (key: string) => permissionKeys.has(key)
  const navigationItems = [
    { href: "/dashboard", label: t("nav.dashboard"), icon: "⌂" },
    can("customers:view") ? { href: "/customers", label: t("nav.customers"), icon: "♙" } : null,
    can("projects:view") ? { href: "/projects", label: t("nav.projects"), icon: "◇" } : null,
    can("documents:view") ? { href: "/documents", label: t("nav.documents"), icon: "□" } : null,
    can("finance:view") ? { href: "/finance", label: t("nav.finance"), icon: "⌁" } : null,
    can("articles:view") ? { href: "/articles", label: t("nav.articles"), icon: "▣" } : null
  ].filter((item): item is { href: string; label: string; icon: string } => Boolean(item))

  if (isPublicAuthPage) return <>{children}</>

  return (
    <NavigationShell
      title="Dream Invoice"
      items={navigationItems}
      variant="light"
      searchLabel={isEnglish ? "Search" : "Suchen"}
      settingsLabel={isEnglish ? "Settings" : "Einstellungen"}
      notificationsLabel={isEnglish ? "Notifications" : "Benachrichtigungen"}
      currentUser={currentUser}
      showSettings={can("settings:manage")}
      profileLabel={isEnglish ? "User menu" : "Benutzermenue"}
      accountLabel={isEnglish ? "Account & Security" : "Konto & Sicherheit"}
      profileHref="/account/security"
      logoutLabel={isEnglish ? "Sign out" : "Abmelden"}
      onLogout={handleLogout}
    >
      {children}
    </NavigationShell>
  )
}
