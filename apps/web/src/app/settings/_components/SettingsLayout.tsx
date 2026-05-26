"use client"

import Link from "next/link"
import type { ComponentType, ReactNode } from "react"
import { usePathname } from "next/navigation"
import {
  Banknote,
  BellRing,
  Building2,
  FileKey2,
  FolderTree,
  Gavel,
  Globe2,
  Hash,
  Mail,
  Settings,
  UsersRound
} from "lucide-react"
import { useLanguage } from "@/lib/i18n"

type TranslationKey = Parameters<ReturnType<typeof useLanguage>["t"]>[0]

type Item = {
  href: string
  labelKey: TranslationKey
  subKey: TranslationKey
  icon: ComponentType<{ className?: string }>
}

const items: Item[] = [
  { href: "/settings/company", labelKey: "settings.nav.company", subKey: "settings.nav.company.sub", icon: Building2 },
  { href: "/settings/categories", labelKey: "settings.nav.categories", subKey: "settings.nav.categories.sub", icon: FolderTree },
  { href: "/settings/finance", labelKey: "settings.nav.finance", subKey: "settings.nav.finance.sub", icon: Banknote },
  { href: "/settings/number-ranges", labelKey: "settings.nav.numberRanges", subKey: "settings.nav.numberRanges.sub", icon: Hash },
  { href: "/settings/email", labelKey: "settings.nav.email", subKey: "settings.nav.email.sub", icon: Mail },
  { href: "/settings/reminders", labelKey: "settings.nav.reminders", subKey: "settings.nav.reminders.sub", icon: BellRing },
  { href: "/settings/legal", labelKey: "settings.nav.legal", subKey: "settings.nav.legal.sub", icon: Gavel },
  { href: "/settings/portal", labelKey: "settings.nav.portal", subKey: "settings.nav.portal.sub", icon: Globe2 },
  { href: "/settings/users", labelKey: "settings.nav.users", subKey: "settings.nav.users.sub", icon: UsersRound },
  { href: "/settings/system", labelKey: "settings.nav.system", subKey: "settings.nav.system.sub", icon: FileKey2 }
]

export function SettingsLayout({
  title,
  description,
  children,
  action,
  status
}: {
  title: string
  description?: string
  children: ReactNode
  action?: () => void
  status?: string
}) {
  const pathname = usePathname()
  const { t } = useLanguage()

  return (
    <div className="overflow-hidden rounded-[36px] border border-[#e3e9f1] bg-[#f8f9fb] shadow-[0_10px_32px_rgba(15,23,42,0.06)]">
      <div className="grid min-h-[760px] grid-cols-[315px_1fr]">
        <aside className="border-r border-[#e6ebf1] p-7">
          <h2 className="mb-7 text-[34px] font-extrabold tracking-tight text-[#1d2433]">
            {t("settings.title")}
          </h2>

          <div className="space-y-3">
            {items.map((item) => {
              const active = pathname === item.href || pathname?.startsWith(item.href + "/")
              const Icon = item.icon

              return (
                <Link key={item.href} href={item.href} className="block no-underline">
                  <div
                    className={`group flex items-center gap-4 rounded-[28px] px-4 py-3.5 transition ${
                      active
                        ? "translate-x-1 bg-white text-[#111827] shadow-[0_16px_34px_rgba(15,23,42,0.14)] ring-1 ring-[#e3e9f1]"
                        : "text-[#64748b] hover:bg-white/70 hover:text-[#111827] hover:shadow-sm"
                    }`}
                  >
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full transition ${
                        active
                          ? "bg-black text-[var(--brand-lime)] shadow-[0_8px_18px_rgba(0,0,0,0.18)]"
                          : "bg-[#e9eef5] text-[#64748b] group-hover:bg-white"
                      }`}
                    >
                      <Icon className="h-5 w-5 stroke-[2.3]" />
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-base font-extrabold">
                        {t(item.labelKey)}
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs font-semibold text-[#94a3b8]">
                        {t(item.subKey)}
                      </p>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

        </aside>

        <main className="p-8">
          <div className="mb-7">
            <h1 className="text-[34px] font-extrabold tracking-tight text-[#1d2433]">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748b]">
                {description}
              </p>
            ) : null}
          </div>

          <div className="space-y-6">
            {children}
          </div>
        </main>
      </div>

      <div className="flex justify-end border-t border-[#e6ebf1] bg-white/50 p-6">
        {status ? (
          <span className="mr-4 self-center text-sm font-bold text-[#64748b]">{status}</span>
        ) : null}
        <button
          type="button"
          onClick={action}
          className="inline-flex items-center gap-2 rounded-full bg-black px-8 py-3 font-extrabold text-[var(--brand-lime)] shadow-sm"
        >
          <Settings className="h-4 w-4" />
          {t("settings.save")}
        </button>
      </div>
    </div>
  )
}
