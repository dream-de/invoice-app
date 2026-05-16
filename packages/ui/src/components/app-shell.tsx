"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ReactNode } from "react"

export type AppShellNavItem = {
  label: string
  href: string
}

type AppShellProps = {
  title: string
  navItems: AppShellNavItem[]
  children: ReactNode
}

export function AppShell({ title, navItems, children }: AppShellProps) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-neutral-50">
      <aside className="fixed inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white p-6">
        <div className="text-xl font-bold">{title}</div>

        <nav className="mt-8 space-y-1">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "block rounded-lg bg-black px-3 py-2 text-sm text-white"
                    : "block rounded-lg px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-100 hover:text-neutral-950"
                }
              >
                {item.label}
              </Link>
            )
          })}
        </nav>
      </aside>

      <div className="pl-64">
        {children}
      </div>
    </div>
  )
}
