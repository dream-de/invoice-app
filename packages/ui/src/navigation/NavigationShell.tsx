"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

type NavigationItem = {
  href: string
  label: string
  icon?: string
}

type NavigationShellUser = {
  name?: string | null
  email?: string | null
  role?: string | null
}

type NavigationShellProps = {
  title: string
  items: NavigationItem[]
  children: ReactNode
  variant?: "light" | "dark"
  searchLabel?: string
  settingsLabel?: string
  notificationsLabel?: string
  currentUser?: NavigationShellUser | null
  showSettings?: boolean
  profileLabel?: string
  profileHref?: string
  accountLabel?: string
  logoutLabel?: string
  onLogout?: () => void | Promise<void>
}

type NotificationApiItem = {
  id: string
  createdAt: string
  category: string
  tone: "success" | "warning" | "info"
  title: string
  message: string
  href?: string
  read: boolean
}

type GlobalSearchItem = {
  href: string
  title: string
  section: string
  keywords: string[]
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  return new Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(date)
}

function SearchIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none">
      <path
        d="m21 21-4.35-4.35M10.8 18.1a7.3 7.3 0 1 1 0-14.6 7.3 7.3 0 0 1 0 14.6Z"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function getUserInitials(user: NavigationShellUser) {
  const source = user.name || user.email || "User"
  const parts = source
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)

  return (parts[0]?.[0] ?? "U").concat(parts[1]?.[0] ?? "").toUpperCase()
}

function BellIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none">
      <path
        d="M18.4 10.1v3.2l1.3 2.4c.33.61-.11 1.35-.8 1.35H5.1c-.69 0-1.13-.74-.8-1.35l1.3-2.4v-3.2a6.4 6.4 0 0 1 12.8 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.75 20a2.45 2.45 0 0 0 4.5 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M12 3.1V2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  )
}

function AccountIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none">
      <path
        d="M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.8 20.2c.8-3.6 3.43-5.4 7.2-5.4s6.4 1.8 7.2 5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[17px] w-[17px]" fill="none">
      <path
        d="M10.5 6.5H6.8A2.3 2.3 0 0 0 4.5 8.8v6.4a2.3 2.3 0 0 0 2.3 2.3h3.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M14.5 8.2 18.3 12l-3.8 3.8M18 12H9.2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function NavigationShell({
  title,
  items,
  children,
  searchLabel = "Suchen…",
  settingsLabel = "Einstellungen",
  notificationsLabel = "Benachrichtigungen",
  currentUser = null,
  showSettings = true,
  profileLabel = "Profil",
  profileHref = "/account/security",
  accountLabel = "Konto & Sicherheit",
  logoutLabel = "Abmelden",
  onLogout
}: NavigationShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchCloseTimerRef = useRef<number | null>(null)
  const [notifications, setNotifications] = useState<NotificationApiItem[]>([])
  const [notificationCount, setNotificationCount] = useState(0)
  const isEnglish = notificationsLabel.toLowerCase().includes("notification")

  const prefetchTargets = useMemo(() => {
    const hrefs = new Set(items.map((item) => item.href))
    if (showSettings) hrefs.add("/settings/company")
    if (profileHref) hrefs.add(profileHref)

    return Array.from(hrefs).filter((href) => href && href !== pathname)
  }, [items, pathname, profileHref, showSettings])

  useEffect(() => {
    for (const href of prefetchTargets) {
      router.prefetch(href)
    }
  }, [prefetchTargets, router])

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      try {
        const response = await fetch("/api/notifications?limit=5", { cache: "no-store" })
        const result = await response.json().catch(() => null)

        if (cancelled) return

        setNotifications(Array.isArray(result?.notifications) ? result.notifications : [])
        setNotificationCount(Number.isFinite(result?.unreadCount) ? result.unreadCount : 0)
      } catch {
        if (!cancelled) {
          setNotifications([])
          setNotificationCount(0)
        }
      }
    }

    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30000)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    setNotificationsOpen(false)
    setSearchOpen(false)
    setUserMenuOpen(false)
    setSearchQuery("")
  }, [pathname])

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        setSearchOpen(true)
        setNotificationsOpen(false)
      }

      if (event.key === "Escape") {
        setSearchOpen(false)
        setNotificationsOpen(false)
        setUserMenuOpen(false)
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    return () => {
      if (searchCloseTimerRef.current) {
        window.clearTimeout(searchCloseTimerRef.current)
      }
    }
  }, [])

  const searchItems = useMemo<GlobalSearchItem[]>(() => {
    const fixedItems: GlobalSearchItem[] = [
      { href: "/dashboard", title: "Dashboard", section: isEnglish ? "Overview" : "Übersicht", keywords: ["dashboard", "start", "home", "übersicht"] },
      { href: "/customers", title: isEnglish ? "Customers" : "Kunden", section: isEnglish ? "Master data" : "Stammdaten", keywords: ["kunden", "customers", "kontakte", "contacts"] },
      { href: "/customers/new", title: isEnglish ? "New customer" : "Neuen Kunden anlegen", section: isEnglish ? "Action" : "Aktion", keywords: ["kunde", "customer", "kontakt", "adresse"] },
      { href: "/projects", title: isEnglish ? "Projects" : "Projekte", section: isEnglish ? "Work" : "Arbeit", keywords: ["projekte", "projects", "projekt"] },
      { href: "/projects/new", title: isEnglish ? "New project" : "Neues Projekt starten", section: isEnglish ? "Action" : "Aktion", keywords: ["projekt", "project", "neu"] },
      { href: "/documents", title: isEnglish ? "Documents" : "Dokumente", section: isEnglish ? "Invoices" : "Rechnungen", keywords: ["documents", "dokumente", "rechnungen", "invoices"] },
      { href: "/documents/new", title: isEnglish ? "Create invoice" : "Neue Rechnung erstellen", section: isEnglish ? "Action" : "Aktion", keywords: ["rechnung", "invoice", "neu", "plus", "erstellen"] },
      { href: "/documents/templates", title: isEnglish ? "Templates" : "Vorlagen", section: isEnglish ? "Documents" : "Dokumente", keywords: ["templates", "vorlagen", "rechnungsvorlage", "editor"] },
      { href: "/articles", title: isEnglish ? "Articles" : "Artikel", section: isEnglish ? "Catalog" : "Katalog", keywords: ["artikel", "articles", "produkte", "leistungen", "katalog"] },
      { href: "/articles/new", title: isEnglish ? "New article" : "Neuen Artikel anlegen", section: isEnglish ? "Action" : "Aktion", keywords: ["artikel", "article", "produkt", "preis"] },
      { href: "/finance", title: isEnglish ? "Finance" : "Finanzen", section: isEnglish ? "Reports" : "Auswertung", keywords: ["finance", "finanzen", "report", "datev", "umsatz"] },
      { href: "/finance/accounts", title: isEnglish ? "Bank accounts" : "Bankkonten", section: isEnglish ? "Finance" : "Finanzen", keywords: ["bank", "konto", "accounts", "import"] },
      { href: "/finance/accounts/import", title: isEnglish ? "Import bank transactions" : "Bankumsätze importieren", section: isEnglish ? "Import" : "Import", keywords: ["import", "bank", "csv", "umsätze"] },
      { href: "/settings", title: isEnglish ? "Settings" : "Einstellungen", section: isEnglish ? "System" : "System", keywords: ["settings", "einstellungen", "system"] },
      { href: "/settings/company", title: isEnglish ? "Company settings" : "Firmendaten", section: isEnglish ? "Settings" : "Einstellungen", keywords: ["firma", "company", "adresse"] },
      { href: "/settings/email", title: isEnglish ? "Email settings" : "E-Mail einrichten", section: isEnglish ? "Settings" : "Einstellungen", keywords: ["email", "e-mail", "smtp", "resend", "mail"] },
      { href: "/settings/system", title: isEnglish ? "System and language" : "System und Sprache", section: isEnglish ? "Settings" : "Einstellungen", keywords: ["system", "sprache", "language", "backup"] }
    ]

    const fixedItemsForAllowedAreas = fixedItems.filter((item) => {
      if (item.href.startsWith("/settings")) return showSettings
      if (item.href === "/dashboard") return true
      return items.some((navItem) => item.href === navItem.href || item.href.startsWith(`${navItem.href}/`))
    })

    const navigationItems = items.map((item) => ({
      href: item.href,
      title: item.label,
      section: isEnglish ? "Navigation" : "Navigation",
      keywords: [item.label, item.href]
    }))

    return Array.from(new Map([...navigationItems, ...fixedItemsForAllowedAreas].map((item) => [item.href, item])).values())
  }, [isEnglish, items, showSettings])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return []

    return searchItems
      .filter((item) => [item.title, item.section, item.href, ...item.keywords].join(" ").toLowerCase().includes(query))
      .slice(0, 8)
  }, [searchItems, searchQuery])

  const visibleNotifications = notifications.length > 0
    ? notifications
    : [{
      id: "all-good",
      createdAt: "",
      category: "system",
      tone: "success" as const,
      title: isEnglish ? "Everything looks good" : "Alles sieht gut aus",
      message: isEnglish ? "No open notifications right now." : "Aktuell gibt es keine offenen Hinweise.",
      read: true
    }]
  const userInitials = currentUser ? getUserInitials(currentUser) : ""

  async function markNotificationRead(id: string) {
    if (id === "all-good") return

    setNotifications((current) => current.map((item) => item.id === id ? { ...item, read: true } : item))
    setNotificationCount((current) => Math.max(0, current - 1))

    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [id] })
    }).catch(() => null)
  }

  async function handleLogout() {
    if (!onLogout || isLoggingOut) return

    setIsLoggingOut(true)
    try {
      await onLogout()
    } finally {
      setIsLoggingOut(false)
      setUserMenuOpen(false)
    }
  }

  function keepSearchOpen() {
    if (searchCloseTimerRef.current) {
      window.clearTimeout(searchCloseTimerRef.current)
      searchCloseTimerRef.current = null
    }
  }

  function closeSearchAfterPointerLeave() {
    keepSearchOpen()
    searchCloseTimerRef.current = window.setTimeout(() => {
      setSearchOpen(false)
      setSearchQuery("")
    }, 260)
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-app)] text-slate-950">
      <div className="invoice-app-zoom">
        <header className="invoice-top-header bg-[var(--bg-surface)]">
        <div className="invoice-top-header-inner mx-auto max-w-[1820px]">
          <Link
            href="/dashboard"
            className={`invoice-brand-link no-underline ${focusRing}`}
            aria-label={title}
          >
            <img
              src="/brand/dream-invoice-header-logo.png"
              alt={title}
              className="invoice-brand-logo invoice-brand-logo-dream"
            />
          </Link>

          <nav className="invoice-main-nav">
            <div className="invoice-main-nav-pill">
              {items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`invoice-main-nav-link ${focusRing} ${
                      active ? "invoice-main-nav-link-active" : ""
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </nav>

          <div className="invoice-header-actions">
            <div
              className="invoice-search-wrap"
              onMouseEnter={keepSearchOpen}
              onMouseLeave={closeSearchAfterPointerLeave}
            >
              <button
                type="button"
                className={`invoice-header-search invoice-header-search-button ${focusRing}`}
                onClick={() => {
                  setSearchOpen((open) => !open)
                  setNotificationsOpen(false)
                  setUserMenuOpen(false)
                }}
                aria-label={searchLabel}
                aria-expanded={searchOpen}
              >
                <span className="invoice-search-button-content">
                  <SearchIcon />
                  <span>{searchLabel}</span>
                </span>
                <kbd className="invoice-search-shortcut">⌘K</kbd>
              </button>

              {searchOpen ? (
                <div className="invoice-search-panel" role="dialog" aria-label={searchLabel}>
                  <div className="invoice-search-field">
                    <SearchIcon />
                    <input
                      autoFocus
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={isEnglish ? "Search pages and actions" : "Seiten und Aktionen suchen"}
                      className="invoice-search-input"
                    />
                  </div>

                  <div className="invoice-search-results">
                    {searchQuery.trim().length === 0 ? null : searchResults.length > 0 ? (
                      searchResults.map((item) => (
                        <Link key={item.href} href={item.href} className={`invoice-search-result no-underline ${focusRing}`}>
                          <span>
                            <span className="invoice-search-result-title">{item.title}</span>
                            <span className="invoice-search-result-section">{item.section}</span>
                          </span>
                          <span className="invoice-search-result-arrow">↵</span>
                        </Link>
                      ))
                    ) : (
                      <div className="invoice-search-empty">
                        {isEnglish ? "No matching page found." : "Keine passende Seite gefunden."}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {showSettings ? (
              <Link
                href="/settings/company"
                aria-label={settingsLabel}
                className={`invoice-header-icon no-underline ${
                  pathname.startsWith("/settings") ? "invoice-header-icon-active" : ""
                } ${focusRing}`}
              >
                ⚙
              </Link>
            ) : null}

            <div className="invoice-notification-wrap">
              <button
                type="button"
                aria-label={notificationsLabel}
                aria-expanded={notificationsOpen}
                onClick={() => {
                  setNotificationsOpen((open) => !open)
                  setUserMenuOpen(false)
                  setSearchOpen(false)
                }}
                className={`invoice-header-icon invoice-header-bell ${notificationsOpen ? "invoice-header-icon-active" : ""} ${focusRing}`}
              >
                <BellIcon />
                {notificationCount > 0 ? (
                  <span className="invoice-header-badge">{notificationCount}</span>
                ) : null}
              </button>

              {notificationsOpen ? (
                <div className="invoice-notification-panel" role="dialog" aria-label={notificationsLabel}>
                  <div className="invoice-notification-head">
                    <div>
                      <p className="invoice-notification-title">{notificationsLabel}</p>
                      <p className="invoice-notification-subtitle">
                        {isEnglish ? "Latest app events" : "Neueste App-Hinweise"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className={`invoice-notification-close ${focusRing}`}
                    >
                      {isEnglish ? "Close" : "Schließen"}
                    </button>
                  </div>

                  <div className="invoice-notification-list">
                    {visibleNotifications.map((item) => {
                      const content = (
                        <>
                          <span className={`invoice-notification-dot invoice-notification-dot-${item.tone}`} />
                          <span className="min-w-0">
                            <span className="invoice-notification-item-title">{item.title}</span>
                            <span className="invoice-notification-item-text">{item.message}</span>
                          </span>
                          {item.createdAt ? <span className="invoice-notification-time">{formatNotificationTime(item.createdAt)}</span> : null}
                        </>
                      )

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`invoice-notification-item no-underline ${focusRing}`}
                            onClick={() => markNotificationRead(item.id)}
                          >
                            {content}
                          </Link>
                        )
                      }

                      return (
                        <button
                          key={item.id}
                          type="button"
                          className={`invoice-notification-item w-full text-left ${focusRing}`}
                          onClick={() => markNotificationRead(item.id)}
                        >
                          {content}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>

            {currentUser ? (
              <div className="invoice-user-wrap">
                <button
                  type="button"
                  aria-label={profileLabel}
                  aria-expanded={userMenuOpen}
                  onClick={() => {
                    setUserMenuOpen((open) => !open)
                    setNotificationsOpen(false)
                    setSearchOpen(false)
                  }}
                  className={`invoice-user-button ${userMenuOpen ? "invoice-header-icon-active" : ""} ${focusRing}`}
                >
                  {userInitials}
                </button>

                {userMenuOpen ? (
                  <div className="invoice-user-panel" role="dialog" aria-label={profileLabel}>
                    <div className="invoice-user-panel-head">
                      <span className="invoice-user-avatar">{userInitials}</span>
                      <span className="invoice-user-name">{currentUser.name || currentUser.email}</span>
                      <span className="invoice-user-email">{currentUser.email}</span>
                      {currentUser.role ? <span className="invoice-user-role">{currentUser.role}</span> : null}
                    </div>
                    <Link
                      href={profileHref}
                      onClick={() => setUserMenuOpen(false)}
                      className={`invoice-user-menu-link no-underline ${focusRing}`}
                    >
                      <AccountIcon />
                      <span>{accountLabel}</span>
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className={`invoice-user-logout ${focusRing}`}
                    >
                      <LogoutIcon />
                      <span>{isLoggingOut ? "..." : logoutLabel}</span>
                    </button>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </header>

        <main className="mx-auto max-w-[1820px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
          {children}
        </main>
      </div>
    </div>
  )
}
