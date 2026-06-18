"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

const reminderStages = [
  {
    days: 7,
    title: "Erste Mahnung",
    description: "Nach 7 Tagen wird die erste Mahnstufe vorbereitet."
  },
  {
    days: 14,
    title: "Zweite Mahnung",
    description: "Nach 14 Tagen bleibt die Mahnstufe als vorbereitet markiert."
  },
  {
    days: 30,
    title: "Letzte Mahnung",
    description: "Nach 30 Tagen ist die finale Mahnstufe sichtbar vorbereitet."
  }
]

export default function RemindersSettingsPage() {
  const { t } = useLanguage()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const isPremium = pathname?.startsWith("/dashboard-v2/settings/")
  const currentTheme = searchParams.get("theme")
  const emailHref = `${isPremium ? "/dashboard-v2/settings/email" : "/settings/email"}${currentTheme ? `?theme=${encodeURIComponent(currentTheme)}` : ""}`

  return (
    <SettingsLayout
      title={t("settings.reminders.title")}
      description={t("settings.reminders.description")}
    >
      <section className="rounded-[28px] border border-[#e5eaf0] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <div className="grid gap-4 md:grid-cols-3">
          {reminderStages.map((stage) => (
            <article key={stage.days} className="rounded-[22px] bg-[#f8fafc] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-[#64748b]">{stage.days} Tage</p>
                  <h2 className="mt-2 text-lg font-extrabold text-[#111827]">{stage.title}</h2>
                </div>
                <span className="inline-flex rounded-full bg-black px-3 py-1 text-xs font-black text-[var(--brand-lime)]">Vorbereitet</span>
              </div>
              <p className="mt-3 text-sm font-medium leading-6 text-[#64748b]">{stage.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-[28px] border border-[#e5eaf0] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
        <h2 className="text-lg font-extrabold text-[#111827]">Mahnstatus</h2>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748b]">
          Offene und überfällige Rechnungen werden im Dokumentdetail geprüft. Echte Versandaktionen bleiben erst nach SMTP-Konfiguration aktiv.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/dashboard-v2/invoices" className="inline-flex items-center justify-center rounded-full bg-black px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)]">
            Rechnungen öffnen
          </Link>
          <Link href={emailHref} className="inline-flex items-center justify-center rounded-full bg-[#eef2f7] px-5 py-3 text-sm font-extrabold text-[#111827]">
            E-Mail einrichten
          </Link>
        </div>
      </section>
    </SettingsLayout>
  )
}
