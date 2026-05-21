"use client"

import Link from "next/link"
import {
  ContentCard,
  Currency,
  PageShell
} from "@dream-invoice/ui"

import {
  articles,
  customers,
  documents,
  projects
} from "@/data/invoice-data"
import { translateStatus, useLanguage } from "@/lib/i18n"

type DashboardDocumentStatus = "draft" | "open" | "paid" | "overdue" | "sent"

function normalizeDashboardStatus(status: string): DashboardDocumentStatus {
  const normalized = status.trim().toLowerCase()

  if (normalized === "paid" || normalized === "bezahlt") return "paid"
  if (normalized === "overdue" || normalized === "überfällig" || normalized === "ueberfaellig") return "overdue"
  if (normalized === "draft" || normalized === "entwurf") return "draft"
  if (normalized === "sent" || normalized === "gesendet") return "sent"

  return "open"
}

function statusBadgeClass(status: DashboardDocumentStatus) {
  if (status === "paid") return "bg-emerald-50 text-emerald-700"
  if (status === "overdue") return "bg-red-50 text-red-700"
  if (status === "draft") return "bg-slate-100 text-slate-700"

  return "bg-orange-50 text-orange-700"
}

const dashboardDocuments = documents.map((document) => ({
  ...document,
  statusKey: normalizeDashboardStatus(document.status)
}))

const totalRevenue = dashboardDocuments.reduce((sum, document) => sum + document.amount, 0)
const openDocuments = dashboardDocuments.filter((document) => document.statusKey === "open" || document.statusKey === "sent")
const paidDocuments = dashboardDocuments.filter((document) => document.statusKey === "paid")
const overdueDocuments = dashboardDocuments.filter((document) => document.statusKey === "overdue")
const taxPreview = totalRevenue * 0.19
const latestDocuments = dashboardDocuments.slice(0, 5)

export default function DashboardPage() {
  const { t } = useLanguage()

  const activity = [
    { title: t("dashboard.activity.invoice.title"), text: t("dashboard.activity.invoice.text"), time: t("dashboard.time.today") },
    { title: t("dashboard.activity.customer.title"), text: t("dashboard.activity.customer.text"), time: t("dashboard.time.yesterday") },
    { title: t("dashboard.activity.project.title"), text: t("dashboard.activity.project.text"), time: t("dashboard.time.week") }
  ]

  const quickActions = [
    { title: t("dashboard.quick.invoice.title"), description: t("dashboard.quick.invoice.description"), meta: t("dashboard.quick.invoice.meta"), href: "/documents/new" },
    { title: t("dashboard.quick.customer.title"), description: t("dashboard.quick.customer.description"), meta: t("dashboard.quick.customer.meta"), href: "/customers/new" },
    { title: t("dashboard.quick.project.title"), description: t("dashboard.quick.project.description"), meta: t("dashboard.quick.project.meta"), href: "/projects/new" }
  ]

  const stats = [
    [t("dashboard.stats.customers"), customers.length, "/customers"],
    [t("dashboard.stats.projects"), projects.length, "/projects"],
    [t("dashboard.stats.articles"), articles.length, "/articles"],
    [t("dashboard.stats.overdue"), overdueDocuments.length, "/documents"]
  ] as const

  return (
    <PageShell title="Dashboard" description={t("dashboard.description")}>
      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
        <ContentCard title={t("dashboard.revenue.title")} description={t("dashboard.revenue.description")} className="dashboard-revenue-card">
          <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
            <div className="overflow-hidden rounded-[26px] bg-[#0f172a] p-4 text-white shadow-[0_18px_42px_rgba(15,23,42,0.22)] sm:rounded-[30px] sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">{t("dashboard.revenue.current")}</p>
                  <p className="mt-3 text-[28px] font-medium leading-none tracking-tight text-white sm:mt-4 sm:text-[34px]">4.500 €</p>
                  <p className="mt-2 max-w-md text-xs font-normal leading-relaxed text-slate-300 sm:mt-3 sm:text-sm">{t("dashboard.revenue.note")}</p>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  {t("dashboard.revenue.stable")}
                </span>
              </div>

              <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.07] p-2.5 sm:mt-6 sm:rounded-[24px] sm:p-4">
                <svg viewBox="0 0 520 140" className="h-20 w-full sm:h-36" aria-hidden="true">
                  <defs>
                    <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.52" />
                      <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d="M16 108 C62 78 96 92 136 62 C184 26 220 88 266 52 C314 14 362 46 410 28 C454 12 482 26 504 10" fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
                  <path d="M16 108 C62 78 96 92 136 62 C184 26 220 88 266 52 C314 14 362 46 410 28 C454 12 482 26 504 10 L504 140 L16 140 Z" fill="url(#dashboardRevenueFill)" />
                  <circle cx="266" cy="52" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="3" />
                  <circle cx="504" cy="10" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
                </svg>
              </div>
            </div>

            <div className="rounded-[26px] border border-[#e6ebf1] bg-[#f8fafc] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-5">
              <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">{t("dashboard.status.title")}</p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-1">
                {[
                  ["bg-orange-500", t("dashboard.status.open"), "text-orange-500", openDocuments.reduce((sum, d) => sum + d.amount, 0)],
                  ["bg-emerald-500", t("dashboard.status.paid"), "text-emerald-600", paidDocuments.reduce((sum, d) => sum + d.amount, 0)],
                  ["bg-blue-600", t("dashboard.status.tax"), "text-blue-600", taxPreview]
                ].map(([dot, label, color, value]) => (
                  <div key={label as string} className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.05)] sm:rounded-[18px] sm:px-4 sm:py-3">
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 rounded-full ${dot}`} />
                      <div>
                        <p className={`text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.18em] ${color}`}>{label}</p>
                        <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]"><Currency value={value as number} /></p>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 shadow-[0_8px_18px_rgba(15,23,42,0.05)] sm:rounded-[18px] sm:px-4 sm:py-3">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full bg-slate-950" />
                    <div>
                      <p className="text-[9px] font-medium uppercase tracking-[0.14em] text-slate-500 sm:text-[10px] sm:tracking-[0.18em]">{t("dashboard.status.documents")}</p>
                      <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]">{t("dashboard.status.activeDocuments")}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ContentCard>

        <ContentCard title={t("dashboard.quick.title")} description={t("dashboard.quick.description")}>
          <div className="space-y-3">
            {quickActions.map((action) => (
              <Link key={action.href} href={action.href} className="block w-full rounded-[14px] border border-[#e6ebf1] bg-[#f8fafc] px-3 py-2.5 text-left no-underline shadow-[0_3px_10px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_8px_16px_rgba(15,23,42,0.07)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-lime)]">
                <span className="flex items-start justify-between gap-4">
                  <span className="min-w-0">
                    <span className="block text-sm font-black text-slate-950">{action.title}</span>
                    <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">{action.description}</span>
                  </span>
                  <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 ring-1 ring-[#e6ebf1]">{action.meta}</span>
                </span>
              </Link>
            ))}
          </div>
        </ContentCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <ContentCard title={t("dashboard.latest.title")} description={t("dashboard.latest.description")}>
          <div className="overflow-hidden rounded-[24px] border border-[#e5eaf0] bg-white">
            <table className="w-full">
              <thead className="bg-[#f3f6fa] text-left text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
                <tr>
                  <th className="px-5 py-4">{t("dashboard.latest.document")}</th>
                  <th className="px-5 py-4">{t("dashboard.latest.status")}</th>
                  <th className="px-5 py-4 text-right">{t("dashboard.latest.amount")}</th>
                </tr>
              </thead>
              <tbody>
                {latestDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t border-[#edf2f7]">
                    <td className="px-5 py-4">
                      <Link href={`/documents/${doc.id}`} className="font-extrabold text-[#111827] no-underline hover:text-[#2563eb]">{doc.number}</Link>
                      <p className="mt-1 text-sm text-[#64748b]">{doc.customer}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(doc.statusKey)}`}>
                        {translateStatus(doc.statusKey, t)}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-[#111827]"><Currency value={doc.amount} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>

        <ContentCard title={t("dashboard.activity.title")} description={t("dashboard.activity.description")}>
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.title} className="rounded-[20px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-[#111827]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#64748b]">{item.text}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#64748b] shadow-sm">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, href]) => (
          <Link key={label} href={href as string} className="rounded-[24px] border border-[#e4eaf1] bg-white p-6 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#8a94a6]">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-[#111827]">{value}</p>
            <p className="mt-2 text-sm font-medium text-[#64748b]">{t("dashboard.stats.openArea")}</p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
