"use client"

import type { ReactNode } from "react"
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
}

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"

export function NavigationShell({ title, items, children }: NavigationShellProps) {
  const pathname = usePathname()

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
              src="/brand/invoice-wordmark.svg"
              alt={title}
              className="invoice-brand-logo"
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
            <div className="invoice-header-search">Suchen…</div>

            <Link
              href="/settings/company"
              aria-label="Einstellungen"
              className={`invoice-header-icon no-underline ${
                pathname.startsWith("/settings") ? "invoice-header-icon-active" : ""
              } ${focusRing}`}
            >
              ⚙
            </Link>

            <button
              type="button"
              aria-label="Benachrichtigungen"
              className={`invoice-header-icon invoice-header-bell ${focusRing}`}
            >
              🔔
              <span className="invoice-header-badge" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1820px] px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-7">
        {children}
      </main>
    </div>
  )
}
