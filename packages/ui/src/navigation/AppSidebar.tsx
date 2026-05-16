"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

export type SidebarItem = {
  href: string
  label: string
  icon?: string
}

type AppSidebarProps = {
  title?: string
  items?: SidebarItem[]
  variant?: "light" | "dark"
}

export function AppSidebar({
  title = "Invoice",
  items = []
}: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-screen flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-20 items-center border-b border-neutral-200 px-6">
        <Link
          href="/dashboard"
          className="text-3xl font-black tracking-tight text-neutral-900 no-underline"
        >
          {title}
        </Link>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {items.map((item) => {
            const active =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-4 rounded-xl px-4 py-3 text-base font-bold no-underline transition-all duration-200 ${
                  active
                    ? "bg-black text-white shadow-lg"
                    : "text-neutral-900 hover:bg-neutral-100"
                }`}
              >
                <span className="w-5 text-center text-lg">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </nav>

      <div className="border-t border-neutral-200 p-4">
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-sm font-black text-white">
            MM
          </div>

          <div>
            <p className="text-sm font-bold text-neutral-900">
              Erika Beispiel
            </p>

            <p className="text-xs text-neutral-500">
              info@mustermann.de
            </p>
          </div>
        </div>
      </div>
    </aside>
  )
}
