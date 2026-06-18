import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await requireCurrentUser()
    const [customers, projects, articles, invoices] = await Promise.all([
      prisma.customer.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true, notes: true } }),
      prisma.project.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true, description: true, customerId: true } }),
      prisma.article.findMany({ orderBy: { name: "asc" }, take: 100, select: { id: true, name: true, description: true, netPrice: true } }),
      prisma.invoice.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, number: true, type: true, status: true, notes: true, customerId: true, projectId: true, grossTotal: true } })
    ])

    return NextResponse.json({ ok: true, customers, projects, articles, invoices })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
