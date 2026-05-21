"use client"

import type { ReactNode } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

type NavigationItem = {
  href: string
  label: string
  icon?: string
}

type NavigationShellProps = {
  title: string
  items: NavigationItem[]
  children: ReactNode
  variant?: "light" | "dark"
  searchLabel?: string
  settingsLabel?: string
  notificationsLabel?: string
}

type EmailLogEntry = {
  id: string
  createdAt: string
  status: "success" | "error"
  to: string
  subject: string
  documentId?: string
  error?: string
}

type HeaderNotification = {
  id: string
  tone: "success" | "warning" | "info"
  title: string
  text: string
  href?: string
  time?: string
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

export function NavigationShell({
  title,
  items,
  children,
  searchLabel = "Suchen…",
  settingsLabel = "Einstellungen",
  notificationsLabel = "Benachrichtigungen"
}: NavigationShellProps) {
  const pathname = usePathname()
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [emailConfigured, setEmailConfigured] = useState<boolean | null>(null)
  const [emailLog, setEmailLog] = useState<EmailLogEntry[]>([])
  const isEnglish = notificationsLabel.toLowerCase().includes("notification")

  useEffect(() => {
    let cancelled = false

    async function loadNotifications() {
      try {
        const [settingsResponse, logResponse] = await Promise.all([
          fetch("/api/settings/email", { cache: "no-store" }),
          fetch("/api/email/log?limit=4", { cache: "no-store" })
        ])
        const settingsResult = await settingsResponse.json().catch(() => null)
        const logResult = await logResponse.json().catch(() => null)

        if (cancelled) return

        const provider = settingsResult?.settings?.provider
        const fromEmail = settingsResult?.settings?.fromEmail
        setEmailConfigured(Boolean(provider && provider !== "disabled" && fromEmail))
        setEmailLog(Array.isArray(logResult?.entries) ? logResult.entries : [])
      } catch {
        if (!cancelled) {
          setEmailConfigured(false)
          setEmailLog([])
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
      }
    }

    window.addEventListener("keydown", handleKeyDown)

    return () => window.removeEventListener("keydown", handleKeyDown)
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

    const navigationItems = items.map((item) => ({
      href: item.href,
      title: item.label,
      section: isEnglish ? "Navigation" : "Navigation",
      keywords: [item.label, item.href]
    }))

    return Array.from(new Map([...navigationItems, ...fixedItems].map((item) => [item.href, item])).values())
  }, [isEnglish, items])

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()

    if (!query) return searchItems.slice(0, 7)

    return searchItems
      .filter((item) => [item.title, item.section, item.href, ...item.keywords].join(" ").toLowerCase().includes(query))
      .slice(0, 8)
  }, [searchItems, searchQuery])

  const notifications = useMemo<HeaderNotification[]>(() => {
    const items: HeaderNotification[] = []

    if (emailConfigured === false) {
      items.push({
        id: "email-settings",
        tone: "warning",
        title: isEnglish ? "Email delivery is not active" : "E-Mail-Versand ist nicht aktiv",
        text: isEnglish ? "Configure SMTP or Resend before sending invoices." : "SMTP oder Resend einrichten, bevor Rechnungen versendet werden.",
        href: "/settings/email"
      })
    }

    for (const entry of emailLog) {
      items.push({
        id: entry.id,
        tone: entry.status === "success" ? "success" : "warning",
        title: entry.status === "success"
          ? (isEnglish ? "Invoice email sent" : "Rechnung per E-Mail gesendet")
          : (isEnglish ? "Email delivery failed" : "E-Mail-Versand fehlgeschlagen"),
        text: entry.status === "success"
          ? `${entry.subject} · ${entry.to}`
          : entry.error || `${entry.subject} · ${entry.to}`,
        href: entry.documentId ? `/documents/${entry.documentId}` : undefined,
        time: formatNotificationTime(entry.createdAt)
      })
    }

    if (items.length === 0) {
      items.push({
        id: "all-good",
        tone: "success",
        title: isEnglish ? "Everything looks good" : "Alles sieht gut aus",
        text: isEnglish ? "No open notifications right now." : "Aktuell gibt es keine offenen Hinweise."
      })
    }

    return items.slice(0, 5)
  }, [emailConfigured, emailLog, isEnglish])

  const notificationCount = notifications.filter((item) => item.id !== "all-good").length

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--bg-app)] text-slate-950">
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
            <div className="invoice-search-wrap">
              <button
                type="button"
                className={`invoice-header-search invoice-header-search-button ${focusRing}`}
                onClick={() => {
                  setSearchOpen((open) => !open)
                  setNotificationsOpen(false)
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
                    {searchResults.length > 0 ? (
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

            <Link
              href="/settings/company"
              aria-label={settingsLabel}
              className={`invoice-header-icon no-underline ${
                pathname.startsWith("/settings") ? "invoice-header-icon-active" : ""
              } ${focusRing}`}
            >
              ⚙
            </Link>

            <div className="invoice-notification-wrap">
              <button
                type="button"
                aria-label={notificationsLabel}
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((open) => !open)}
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
                    {notifications.map((item) => {
                      const content = (
                        <>
                          <span className={`invoice-notification-dot invoice-notification-dot-${item.tone}`} />
                          <span className="min-w-0">
                            <span className="invoice-notification-item-title">{item.title}</span>
                            <span className="invoice-notification-item-text">{item.text}</span>
                          </span>
                          {item.time ? <span className="invoice-notification-time">{item.time}</span> : null}
                        </>
                      )

                      if (item.href) {
                        return (
                          <Link
                            key={item.id}
                            href={item.href}
                            className={`invoice-notification-item no-underline ${focusRing}`}
                          >
                            {content}
                          </Link>
                        )
                      }

                      return (
                        <div key={item.id} className="invoice-notification-item">
                          {content}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1820px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        {children}
      </main>
    </div>
  )
}
