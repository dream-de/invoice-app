"use client"

import Link from "next/link"
import { useState } from "react"
import {
  ArrowRight,
  BarChart3,
  CircleDollarSign,
  Clock3,
  Percent,
  ReceiptText,
  TrendingUp
} from "lucide-react"
import { Currency, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

const months = [
  { label: "Jan", value: 0 },
  { label: "Feb", value: 0 },
  { label: "Mär", value: 0 },
  { label: "Apr", value: 0 },
  { label: "Mai", value: 0 },
  { label: "Jun", value: 0 },
  { label: "Jul", value: 0 },
  { label: "Aug", value: 0 },
  { label: "Sep", value: 0 },
  { label: "Okt", value: 0 },
  { label: "Nov", value: 0 },
  { label: "Dez", value: 0 }
]

export default function FinanceStatisticsPage() {
  const { t } = useLanguage()
  const periods = [t("finance.statistics.period.month"), t("finance.statistics.period.quarter"), t("finance.statistics.period.year"), t("finance.statistics.period.total")]
  const metrics = [
    { label: t("finance.statistics.metrics.paidRevenue"), value: 0, icon: CircleDollarSign },
    { label: t("finance.statistics.metrics.openClaims"), value: 0, icon: Clock3 },
    { label: t("finance.statistics.metrics.averageInvoice"), value: 0, icon: ReceiptText },
    { label: t("finance.statistics.metrics.paymentRate"), value: "0%", icon: Percent }
  ]
  const [period, setPeriod] = useState(t("finance.statistics.period.year"))

  return (
    <PageShell
      title={t("finance.statistics.title")}
      description={t("finance.statistics.description")}
    >
      <div className="space-y-6">
        <div className="flex w-max max-w-full items-center gap-1 overflow-x-auto rounded-full bg-[#eef2f7] p-1">
          {periods.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setPeriod(item)}
              className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold transition ${
                period === item
                  ? "bg-black text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-5 max-lg:grid-cols-2 max-sm:grid-cols-1">
          {metrics.map((item) => {
            const Icon = item.icon

            return (
              <div
                key={item.label}
                className="min-h-[148px] rounded-3xl border border-gray-200 bg-gray-50 p-6"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
                    <Icon className="h-5 w-5" />
                  </span>
                </div>

                <p className="mt-5 text-sm font-semibold text-slate-500">
                  {item.label}
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                  {typeof item.value === "number" ? <Currency value={item.value} /> : item.value}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {t("finance.statistics.revenue.title")}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {t("finance.statistics.revenue.description")}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]">
                <TrendingUp className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-8 grid grid-cols-6 gap-3 max-lg:grid-cols-4 max-sm:grid-cols-2">
              {months.map((month) => (
                <div
                  key={month.label}
                  className="rounded-2xl bg-white p-4 text-center ring-1 ring-gray-200"
                >
                  <p className="text-sm font-extrabold text-slate-950">
                    <Currency value={month.value} />
                  </p>
                  <p className="mt-2 text-xs font-semibold text-slate-400">
                    {month.label}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-gray-50 p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">
                  {t("finance.statistics.topCustomers.title")}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  {t("finance.statistics.topCustomers.description")}
                </p>
              </div>

              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
                <BarChart3 className="h-5 w-5" />
              </span>
            </div>

            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
              <p className="text-sm font-semibold text-slate-500">
                {t("finance.statistics.empty")}
              </p>
            </div>

            <Link
              href="/customers"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white no-underline"
            >
              {t("finance.statistics.allCustomers")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
