"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Briefcase,
  FileText,
  FolderKanban,
  LayoutDashboard,
  Moon,
  Package,
  Search,
  Settings,
  Wallet
} from "lucide-react";
import { ReactNode, useState } from "react";

const navigation = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Rechnungen", href: "/documents", icon: FileText },
  { label: "Kunden", href: "/customers", icon: Briefcase },
  { label: "Projekte", href: "/projects", icon: FolderKanban },
  { label: "Artikel", href: "/articles", icon: Package },
  { label: "Finanzen", href: "/finance", icon: Wallet },
  { label: "Einstellungen", href: "/settings", icon: Settings }
];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [openNotifications, setOpenNotifications] = useState(false);

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[280px] flex-col border-r border-slate-200 bg-white px-5 py-6 lg:flex">
        <Link href="/dashboard" className={`mb-10 no-underline ${focusRing}`}>
          <div className="text-lg font-black leading-5 text-slate-950">
            Invoice
          </div>
        </Link>

        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const active =
              pathname === item.href || (pathname ?? "").startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-11 items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold no-underline transition ${focusRing} ${
                  active
                    ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-100"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
              AD
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">Admin Demo</p>
              <p className="text-xs text-slate-500">admin@invoice-app.local</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-[280px]">
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
          <div className="flex min-h-20 flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-10">
            <Link
              href="/dashboard"
              className={`flex min-h-11 items-center gap-3 no-underline lg:hidden ${focusRing}`}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white">
                IA
              </div>
              <span className="font-black">Invoice</span>
            </Link>

            <div className="hidden flex-1 md:block lg:max-w-md">
              <div className="flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm">
                <Search className="h-5 w-5 text-slate-400" />
                <input
                  placeholder="Suche..."
                  className={`min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400 ${focusRing}`}
                />
                <span className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
                  Strg K
                </span>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 sm:h-12 sm:w-12 ${focusRing}`}
                aria-label="Darstellung wechseln"
              >
                <Moon className="h-5 w-5" />
              </button>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setOpenNotifications(!openNotifications)}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50 sm:h-12 sm:w-12 ${focusRing}`}
                  aria-label="Benachrichtigungen"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-red-500" />
                </button>

                {openNotifications && (
                  <div className="absolute right-0 top-14 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:top-16">
                    <div className="mb-5 flex items-center justify-between gap-4">
                      <h3 className="text-lg font-black text-slate-950">
                        Benachrichtigungen
                      </h3>

                      <button
                        type="button"
                        onClick={() => setOpenNotifications(false)}
                        className={`min-h-11 rounded-xl bg-slate-100 px-3 py-2 text-xs font-bold transition hover:bg-slate-200 ${focusRing}`}
                      >
                        Schließen
                      </button>
                    </div>

                    <div className="space-y-3">
                      {[
                        ["Neue Rechnung erstellt", "RE-2026-001 wurde gespeichert."],
                        ["Zahlung erhalten", "Musterfirma GmbH hat bezahlt."],
                        ["Backup erfolgreich", "System Sicherung wurde erstellt."]
                      ].map((item) => (
                        <div key={item[0]} className="rounded-2xl bg-slate-50 p-4">
                          <p className="font-black text-slate-900">{item[0]}</p>
                          <p className="mt-1 text-sm text-slate-500">{item[1]}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <Link
                href="/settings/company"
                className={`flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-sm font-black text-white no-underline shadow-sm transition hover:bg-blue-700 sm:h-12 sm:w-12 ${focusRing}`}
                aria-label="Profil und Firmeneinstellungen"
              >
                AD
              </Link>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1600px] p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
