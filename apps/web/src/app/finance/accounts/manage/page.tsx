"use client"

import Link from "next/link"
import { ArrowLeft, Building2, Plus, Trash2 } from "lucide-react"
import { Currency, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

const accounts = [
  ["Hauptgeschäftskonto", "DE12 3456 7890 1234 5678 90", 124500],
  ["Steuerrücklagen", "DE99 8877 6655 4433 2211 00", 45000],
  ["PayPal Business", "paypal@firma.de", 3420]
] as const

export default function ManageAccountsPage() {
  const { t } = useLanguage()

  return (
    <PageShell title={t("finance.accounts.manage.title")} description={t("finance.accounts.manage.description")}>
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {t("finance.accounts.manage.back")}
          </Link>
          <button className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[var(--brand-lime)]">
            <Plus className="h-4 w-4" />
            {t("finance.accounts.manage.create")}
          </button>
        </div>

        <div className="space-y-3">
          {accounts.map(([name, iban, balance]) => (
            <div key={name} className="grid gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_220px_auto] md:items-center">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
                  <Building2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="font-extrabold text-slate-950">{name}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">{iban}</p>
                </div>
              </div>
              <p className="font-extrabold text-slate-950 md:text-right"><Currency value={balance} /></p>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100" aria-label={t("finance.accounts.deleteAccount")}>
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  )
}
