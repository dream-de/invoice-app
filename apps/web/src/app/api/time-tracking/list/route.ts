import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function formatEntry(entry: {
  id: string
  projectName: string
  task: string
  hours: unknown
  rate: unknown
  amount: unknown
  status: string
  billingStatus: string
  date: Date
  projectId?: string | null
  articleId?: string | null
  project?: { name: string; customerId?: string | null; customer?: { id: string; name: string } | null } | null
  article?: { name: string; number: string } | null
}) {
  const statusLabel = entry.billingStatus === "invoiced"
    ? "Fakturiert"
    : entry.billingStatus === "not_billable"
      ? "Nicht abrechenbar"
      : "Nicht fakturiert"

  return {
    id: entry.id,
    customerId: entry.project?.customer?.id ?? null,
    projectId: entry.projectId ?? null,
    articleId: entry.articleId ?? null,
    customer: entry.project?.customer?.name ?? "Ohne Kunde",
    project: entry.project?.name ?? entry.projectName,
    article: entry.article ? entry.article.name : "Ohne Artikel",
    articleCode: entry.article?.number ?? "",
    note: entry.task,
    duration: Number(entry.hours ?? 0),
    rate: Number(entry.rate ?? 0),
    amount: Number(entry.amount ?? 0),
    billingStatus: entry.billingStatus,
    status: statusLabel,
    invoiceable: entry.billingStatus === "not_invoiced" && entry.status === "billable",
    billable: entry.status === "billable",
    date: entry.date.toISOString().slice(0, 10)
  }
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json({ ok: true, entries: [] })
  }

  try {
    const entries = await prisma.timeEntry.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        project: { include: { customer: true } },
        article: true
      }
    })

    return NextResponse.json({ ok: true, entries: entries.map(formatEntry) })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, entries: [], error: "Zeiten konnten nicht geladen werden." }, { status: 500 })
  }
}
