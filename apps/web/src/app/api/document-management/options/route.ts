import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await requireCurrentUser()
    const [customers, projects, invoices, offers] = await Promise.all([
      prisma.customer.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
      prisma.project.findMany({ orderBy: { name: "asc" }, take: 200, select: { id: true, name: true } }),
      prisma.invoice.findMany({ where: { type: "invoice" }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, number: true } }),
      prisma.invoice.findMany({ where: { type: "offer" }, orderBy: { createdAt: "desc" }, take: 200, select: { id: true, number: true } })
    ])

    return NextResponse.json({ ok: true, customers, projects, invoices, offers })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
