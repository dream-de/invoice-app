import type { ReactNode } from "react"
import { PageShell } from "@dream-invoice/ui"

const settingsItems = [
  {
    title: "Stammdaten",
    description: "Adresse & Kontakt",
    href: "/settings/company"
  },
  {
    title: "Kategorien",
    description: "Produkte & Leistungen",
    href: "/settings/categories"
  },
  {
    title: "Finanzen",
    description: "Bank & Steuern",
    href: "/settings/finance"
  },
  {
    title: "Nummernkreise",
    description: "Rechnungs-, Angebots- & Kundennr.",
    href: "/settings/number-ranges"
  },
  {
    title: "E-Mail",
    description: "SMTP & Resend",
    href: "/settings/email"
  },
  {
    title: "Mahnwesen",
    description: "Mahnstufen & Gebühren",
    href: "/settings/reminders"
  },
  {
    title: "Rechtliches",
    description: "AGB & Steuerregeln",
    href: "/settings/legal"
  },
  {
    title: "Portal",
    description: "Angebotslinks & Sync",
    href: "/settings/portal"
  },  {
    title: "Benutzer & Rechte",
    description: "Login, Rollen & Zugriff",
    href: "/settings/users"
  },

  {
    title: "System",
    description: "Backup & Audit",
    href: "/settings/system"
  }
]

type PremiumSettingsShellProps = {
  description: string
  activeHref?: string
  children: ReactNode
}

export function PremiumSettingsShell({
  description,
  activeHref,
  children
}: PremiumSettingsShellProps) {
  return (
    <PageShell
      title="Einstellungen"
      description={description}
    >
      <div className="overflow-hidden rounded-[2rem] border border-neutral-200 bg-white shadow-xl">
        <div className="grid min-h-[760px] lg:grid-cols-[420px_1fr]">
          <aside className="border-r border-neutral-200 bg-neutral-50/80 p-10">
            <h2 className="text-3xl font-black tracking-tight text-neutral-900">
              Einstellungen
            </h2>

            <div className="mt-10 space-y-4">
              {settingsItems.map((item) => {
                const active = item.href === activeHref

                return (
                  <a
                    key={item.title}
                    href={item.href}
                    className={`flex items-center gap-5 rounded-[2rem] p-5 transition ${
                      active
                        ? "bg-white shadow-lg"
                        : "hover:bg-white/70"
                    }`}
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center rounded-full text-lg ${
                        active
                          ? "bg-black text-lime-300"
                          : "bg-neutral-200 text-neutral-500"
                      }`}
                    >
                      {active ? "▣" : "○"}
                    </div>

                    <div>
                      <p className="text-lg font-bold text-neutral-800">
                        {item.title}
                      </p>
                      <p className="text-sm text-neutral-400">
                        {item.description}
                      </p>
                    </div>
                  </a>
                )
              })}
            </div>
          </aside>

          <section className="bg-white p-10">
            {children}
          </section>
        </div>
      </div>
    </PageShell>
  )
}
