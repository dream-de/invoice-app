"use client"

import type { ReactNode } from "react"
import type { TranslationKey } from "@/i18n/dictionary"
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

type DashboardDocument = (typeof documents)[number] & {
  statusKey: DashboardDocumentStatus
}

type KpiItem = {
  title: string
  helper: string
  value: ReactNode
  tone: string
  marker: string
}

type RevenuePoint = {
  month: string
  value: number
}

type QuickAction = {
  title: string
  description: string
  meta: string
  href: string
}

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

function toPercent(value: number, total: number) {
  if (total <= 0) return 0

  return Math.round((value / total) * 100)
}

const dashboardDocuments: DashboardDocument[] = documents.map((document) => ({
  ...document,
  statusKey: normalizeDashboardStatus(document.status)
}))

const invoiceDocuments = dashboardDocuments.filter((document) => document.type.toLowerCase().includes("rechnung"))
const quoteDocuments = dashboardDocuments.filter((document) => document.type.toLowerCase().includes("angebot") || document.number.startsWith("OF-"))
const totalRevenue = invoiceDocuments.reduce((sum, document) => sum + document.amount, 0)
const openDocuments = dashboardDocuments.filter((document) => document.statusKey === "open" || document.statusKey === "sent")
const paidDocuments = dashboardDocuments.filter((document) => document.statusKey === "paid")
const overdueDocuments = dashboardDocuments.filter((document) => document.statusKey === "overdue")
const draftDocuments = dashboardDocuments.filter((document) => document.statusKey === "draft")
const openAmount = openDocuments.reduce((sum, document) => sum + document.amount, 0)
const paidAmount = paidDocuments.reduce((sum, document) => sum + document.amount, 0)
const overdueAmount = overdueDocuments.reduce((sum, document) => sum + document.amount, 0)
const quoteAmount = quoteDocuments.reduce((sum, document) => sum + document.amount, 0)
const latestDocuments = dashboardDocuments.slice(0, 5)

function DashboardKpiRow({ items }: { items: readonly KpiItem[] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <div key={item.title} className="rounded-[20px] border border-[#e3e9f1] bg-white px-4 py-3.5 shadow-[0_12px_30px_rgba(15,23,42,0.08)] sm:rounded-[22px] sm:px-5 sm:py-4">
          <div className="flex items-start gap-3">
            <span className={["mt-1 h-3 w-3 shrink-0 rounded-full", item.marker].join(" ")} />
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-[#607086]">{item.title}</p>
              <p className="mt-1 text-[27px] font-black leading-none tracking-tight text-[#1d2533]">{item.value}</p>
              <p className={["mt-2 text-[11px] font-bold uppercase tracking-[0.16em]", item.tone].join(" ")}>{item.helper}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function RevenueOverview({ title, description, series }: { title: string; description: string; series: readonly RevenuePoint[] }) {
  const maxValue = Math.max(...series.map((item) => item.value), 1)
  const points = series.map((item, index) => {
    const x = 38 + index * 74
    const y = 172 - (item.value / maxValue) * 116

    return String(Math.round(x)) + "," + String(Math.round(y))
  }).join(" ")

  return (
    <ContentCard title={title} description={description} className="dashboard-revenue-card">
      <div className="rounded-[24px] border border-[#e4eaf1] bg-[#f9fbfe] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] sm:p-5">
        <div className="relative h-[245px] overflow-hidden rounded-[18px] bg-white p-4">
          <div className="absolute inset-x-4 top-10 space-y-11">
            <div className="border-t border-[#e4eaf1]" />
            <div className="border-t border-[#e4eaf1]" />
            <div className="border-t border-[#e4eaf1]" />
            <div className="border-t border-[#e4eaf1]" />
          </div>

          <div className="absolute inset-x-7 bottom-12 flex h-[150px] items-end justify-between">
            {series.map((item) => (
              <div key={item.month} className="w-9 rounded-t-[10px] bg-[#dbe7f4]" style={{ height: String(Math.max(28, Math.round((item.value / maxValue) * 132))) + "px" }} />
            ))}
          </div>

          <svg viewBox="0 0 520 190" className="absolute inset-x-4 bottom-8 h-[190px] w-[calc(100%-32px)]" aria-hidden="true">
            <polyline points={points} fill="none" stroke="#73a7e8" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            {points.split(" ").map((point) => {
              const [x, y] = point.split(",")

              return <circle key={point} cx={x} cy={y} r="5" fill="#ffffff" stroke="#73a7e8" strokeWidth="3" />
            })}
          </svg>

          <div className="absolute inset-x-7 bottom-4 flex justify-between text-[12px] font-semibold text-[#53627a]">
            {series.map((item) => (
              <span key={item.month}>{item.month}</span>
            ))}
          </div>
        </div>
      </div>
    </ContentCard>
  )
}

function StatusOverview({ title, paid, open, overdue, draft, labels }: { title: string; paid: number; open: number; overdue: number; draft: number; labels: { paid: string; open: string; overdue: string; draft: string } }) {
  const total = paid + open + overdue + draft
  const paidPercent = toPercent(paid, total)
  const openPercent = toPercent(open, total)
  const overduePercent = toPercent(overdue, total)

  const chartBackground = "conic-gradient(#72a4df 0 " + paidPercent + "%, #d5dce6 " + paidPercent + "% " + (paidPercent + openPercent) + "%, #dc7185 " + (paidPercent + openPercent) + "% " + (paidPercent + openPercent + overduePercent) + "%, #c4cbd6 " + (paidPercent + openPercent + overduePercent) + "% 100%)"

  return (
    <ContentCard title={title} description="">
      <div className="grid min-h-[326px] place-items-center rounded-[24px] border border-[#e4eaf1] bg-[#f9fbfe] p-5">
        <div className="grid w-full gap-6 sm:grid-cols-[190px_1fr] xl:grid-cols-1 2xl:grid-cols-[190px_1fr]">
          <div className="mx-auto grid h-[178px] w-[178px] place-items-center rounded-full shadow-[0_18px_34px_rgba(15,23,42,0.15)]" style={{ background: chartBackground }}>
            <div className="grid h-[98px] w-[98px] place-items-center rounded-full bg-white text-center shadow-[inset_0_0_0_1px_rgba(15,23,42,0.06)]">
              <span className="text-[24px] font-black text-[#1d2533]">{total}</span>
            </div>
          </div>

          <div className="space-y-3 self-center">
            {[
              ["#72a4df", labels.paid, paid],
              ["#d5dce6", labels.open, open],
              ["#dc7185", labels.overdue, overdue],
              ["#c4cbd6", labels.draft, draft]
            ].map(([color, label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 rounded-[16px] bg-white px-4 py-2.5 shadow-[0_6px_16px_rgba(15,23,42,0.06)]">
                <span className="flex items-center gap-3 text-sm font-bold text-[#47556c]">
                  <span className="h-3.5 w-3.5 rounded-full" style={{ backgroundColor: color as string }} />
                  {label}
                </span>
                <span className="text-sm font-black text-[#1d2533]">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ContentCard>
  )
}

function RecentDocuments({ documents: recentDocuments, title, description, t }: { documents: readonly DashboardDocument[]; title: string; description: string; t: (key: TranslationKey) => string }) {
  return (
    <ContentCard title={title} description={description}>
      <div className="overflow-hidden rounded-[22px] border border-[#e2e8f0] bg-white shadow-[0_12px_28px_rgba(15,23,42,0.07)]">
        <table className="w-full text-sm">
          <thead className="bg-[#f6f8fb] text-left text-[12px] font-black uppercase tracking-[0.14em] text-[#6a768a]">
            <tr>
              <th className="px-5 py-3.5">{t("dashboard.latest.document")}</th>
              <th className="px-5 py-3.5">{t("dashboard.latest.status")}</th>
              <th className="px-5 py-3.5 text-right">{t("dashboard.latest.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {recentDocuments.map((doc) => (
              <tr key={doc.id} className="border-t border-[#edf2f7]">
                <td className="px-5 py-3.5">
                  <Link href={"/documents/" + doc.id} className="font-black text-[#1d2533] no-underline hover:text-[#2563eb]">{doc.number}</Link>
                  <p className="mt-1 text-xs font-semibold text-[#7a8699]">{doc.customer}</p>
                </td>
                <td className="px-5 py-3.5">
                  <span className={["inline-flex rounded-full px-3 py-1 text-xs font-bold", statusBadgeClass(doc.statusKey)].join(" ")}>
                    {translateStatus(doc.statusKey, t)}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right font-black text-[#1d2533]"><Currency value={doc.amount} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </ContentCard>
  )
}


function CurrentInvoicePanel({ document, t }: { document: DashboardDocument; t: (key: TranslationKey) => string }) {
  return (
    <ContentCard title={t("dashboard.current.title")} description={t("dashboard.current.description")}>
      <div className="rounded-[24px] border border-[#e4eaf1] bg-[#f9fbfe] p-4">
        <div className="rounded-[18px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
          <div className="space-y-3 text-sm">
            {[
              [t("dashboard.current.customer"), document.customer],
              [t("dashboard.current.date"), document.number],
              [t("dashboard.current.status"), translateStatus(document.statusKey, t)],
              [t("dashboard.current.amount"), <Currency key="amount" value={document.amount} />]
            ].map(([label, value]) => (
              <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-2.5 last:border-b-0 last:pb-0">
                <span className="font-bold text-[#738096]">{label}</span>
                <span className="text-right font-black text-[#1d2533]">{value}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <Link href={"/documents/" + document.id + "/edit"} className="rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2 text-center text-sm font-black text-[#1d2533] no-underline shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(15,23,42,0.09)]">
              {t("dashboard.current.edit")}
            </Link>
            <Link href={"/documents/" + document.id} className="rounded-[12px] bg-[#72a4df] px-4 py-2 text-center text-sm font-black text-white no-underline shadow-[0_8px_18px_rgba(59,130,246,0.24)] transition hover:-translate-y-0.5 hover:bg-[#5c93d5]">
              {t("dashboard.current.pdf")}
            </Link>
          </div>
        </div>
      </div>
    </ContentCard>
  )
}

function ReportsPanel({ title, description, total, paid, open, quote, t }: { title: string; description: string; total: number; paid: number; open: number; quote: number; t: (key: TranslationKey) => string }) {
  const bars = [paid * 0.32, open * 0.48, total * 0.58, quote * 0.4, total * 0.72, total * 0.64]
  const maxValue = Math.max(...bars, 1)

  return (
    <ContentCard title={title} description={description}>
      <div className="rounded-[24px] border border-[#e4eaf1] bg-[#f9fbfe] p-4">
        <div className="flex flex-wrap gap-3">
          <Link href="/finance/statistics" className="rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2 text-sm font-black text-[#1d2533] no-underline shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5">
            {t("dashboard.reports.monthly")}
          </Link>
          <Link href="/api/documents/export" className="rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2 text-sm font-black text-[#1d2533] no-underline shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5">
            {t("dashboard.reports.csv")}
          </Link>
          <Link href="/documents" className="rounded-[12px] border border-[#d9e1ec] bg-white px-4 py-2 text-sm font-black text-[#1d2533] no-underline shadow-[0_5px_14px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5">
            {t("dashboard.reports.pdf")}
          </Link>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.75fr]">
          <div className="rounded-[18px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
            <div className="flex h-36 items-end justify-between gap-3 border-b border-[#e4eaf1] px-2 pb-3">
              {bars.map((value, index) => (
                <div key={index} className="w-full rounded-t-[10px] bg-[#d8e6f5]" style={{ height: String(Math.max(26, Math.round((value / maxValue) * 120))) + "px" }} />
              ))}
            </div>
            <div className="mt-3 flex justify-between px-1 text-xs font-bold text-[#738096]">
              {["Mo", "Di", "Mi", "Do", "Fr", "Sa"].map((day) => <span key={day}>{day}</span>)}
            </div>
          </div>

          <div className="rounded-[18px] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.07)]">
            <p className="text-sm font-black text-[#1d2533]">{t("dashboard.reports.income")}</p>
            <div className="mt-3 space-y-3 text-sm">
              {[
                [customers[0]?.name ?? "Client A", paid],
                [customers[1]?.name ?? "Client B", open],
                [t("dashboard.reports.quotes"), quote]
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-4 border-b border-[#edf2f7] pb-2 last:border-b-0 last:pb-0">
                  <span className="font-bold text-[#738096]">{label}</span>
                  <span className="font-black text-[#1d2533]"><Currency value={Number(value)} /></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ContentCard>
  )
}

function QuickActions({ actions }: { actions: readonly QuickAction[] }) {
  return (
    <>
      <ContentCard title="Schnellaktionen" description="" className="dashboard-quick-actions-card">
        <div className="flex flex-col items-center rounded-[2.5rem] border border-[#e2e8f0] bg-[#f8fafc] p-6 shadow-md">
          <div className="flex w-full flex-col items-center space-y-4">
            {actions.map((action) => (
              <Link key={action.href} href={action.href} className="flex w-[82%] flex-col items-center rounded-[2.5rem] border border-[#cbd5e1] bg-[#e8eeff] px-5 py-4 text-center no-underline shadow-sm transition hover:-translate-y-0.5 hover:bg-[#dbeafe] hover:shadow-[0_12px_22px_rgba(30,58,138,0.12)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-lime)]">
                <span className="text-base font-semibold leading-tight text-black">{action.title}</span>
                <span className="mt-1 text-sm font-bold leading-tight text-[#64748b]">{action.meta}</span>
              </Link>
            ))}
          </div>
        </div>
      </ContentCard>

      <style>{`
        .dashboard-quick-actions-card h2 {
          margin-bottom: 1.5rem;
          text-align: center;
          color: #000;
        }
      `}</style>
    </>
  )
}

export default function DashboardPage() {
  const { t } = useLanguage()

  const quickActions = [
    { title: t("dashboard.quick.invoice.title"), description: t("dashboard.quick.invoice.description"), meta: t("dashboard.quick.invoice.meta"), href: "/documents/new" },
    { title: t("dashboard.quick.customer.title"), description: t("dashboard.quick.customer.description"), meta: t("dashboard.quick.customer.meta"), href: "/customers/new" },
    { title: t("dashboard.quick.project.title"), description: t("dashboard.quick.project.description"), meta: t("dashboard.quick.project.meta"), href: "/projects/new" }
  ]

  const kpiItems: KpiItem[] = [
    { title: t("dashboard.status.open"), helper: t("dashboard.status.documents"), value: <Currency value={openAmount} />, tone: "text-blue-500", marker: "bg-[#73a7e8]" },
    { title: t("dashboard.status.paid"), helper: t("dashboard.status.documents"), value: <Currency value={paidAmount} />, tone: "text-emerald-500", marker: "bg-[#8fcf9b]" },
    { title: t("dashboard.stats.overdue"), helper: t("dashboard.status.documents"), value: <Currency value={overdueAmount} />, tone: "text-rose-500", marker: "bg-[#dc7185]" },
    { title: t("dashboard.kpi.quotes"), helper: t("dashboard.status.documents"), value: <Currency value={quoteAmount} />, tone: "text-slate-500", marker: "bg-[#aab4c3]" }
  ]

  const revenueSeries: RevenuePoint[] = [
    { month: "Jan", value: Math.max(420, paidAmount * 0.42) },
    { month: "Feb", value: Math.max(720, openAmount * 0.55) },
    { month: "Mar", value: Math.max(580, paidAmount * 0.74) },
    { month: "Apr", value: Math.max(980, totalRevenue * 0.78) },
    { month: "May", value: Math.max(820, totalRevenue * 0.7) },
    { month: "Jun", value: Math.max(1120, totalRevenue * 0.86) },
    { month: "Jul", value: Math.max(1360, totalRevenue) }
  ]

  return (
    <PageShell title="Dashboard" description={t("dashboard.description")}>
      <div className="space-y-6">
        <DashboardKpiRow items={kpiItems} />

        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
          <RevenueOverview title={t("dashboard.revenue.title")} description={t("dashboard.revenue.description")} series={revenueSeries} />
          <StatusOverview title={t("dashboard.status.overview")} paid={paidDocuments.length} open={openDocuments.length} overdue={overdueDocuments.length} draft={draftDocuments.length} labels={{ paid: t("status.paid"), open: t("status.open"), overdue: t("status.overdue"), draft: t("status.draft") }} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <RecentDocuments documents={latestDocuments} title={t("dashboard.latest.title")} description={t("dashboard.latest.description")} t={t} />
          <CurrentInvoicePanel document={latestDocuments[0]} t={t} />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
          <ReportsPanel title={t("dashboard.reports.title")} description={t("dashboard.reports.description")} total={totalRevenue} paid={paidAmount} open={openAmount} quote={quoteAmount} t={t} />
          <QuickActions actions={quickActions} />
        </div>
      </div>
    </PageShell>
  )
}
