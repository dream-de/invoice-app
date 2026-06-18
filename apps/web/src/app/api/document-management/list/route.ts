import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

function stringParam(url: URL, key: string) {
  return (url.searchParams.get(key) || "").trim()
}

function serializeDocument(document: {
  id: string
  name: string
  originalName: string
  documentType: string
  mimeType: string
  size: number
  status: string
  version: number
  createdAt: Date
  updatedAt: Date
  customer?: { id: string; name: string } | null
  project?: { id: string; name: string } | null
  invoice?: { id: string; number: string; type: string | null } | null
}) {
  return {
    id: document.id,
    name: document.name,
    originalName: document.originalName,
    documentType: document.documentType,
    mimeType: document.mimeType,
    size: document.size,
    status: document.status,
    version: document.version,
    createdAt: document.createdAt.toISOString(),
    updatedAt: document.updatedAt.toISOString(),
    customer: document.customer,
    project: document.project,
    invoice: document.invoice,
    downloadUrl: `/api/document-management/${document.id}`
  }
}

export async function GET(request: Request) {
  try {
    await requireCurrentUser()
    const url = new URL(request.url)
    const query = stringParam(url, "q")
    const type = stringParam(url, "type")
    const customer = stringParam(url, "customer")
    const project = stringParam(url, "project")
    const date = stringParam(url, "date")
    const createdAt = date ? new Date(date) : null
    const dateFilter = createdAt && !Number.isNaN(createdAt.getTime())
      ? { gte: createdAt, lt: new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) }
      : undefined

    const documents = await prisma.documentAsset.findMany({
      where: {
        ...(type ? { documentType: type } : {}),
        ...(dateFilter ? { createdAt: dateFilter } : {}),
        ...(query ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { originalName: { contains: query, mode: "insensitive" } },
            { customer: { name: { contains: query, mode: "insensitive" } } },
            { project: { name: { contains: query, mode: "insensitive" } } }
          ]
        } : {}),
        ...(customer ? { customer: { name: { contains: customer, mode: "insensitive" } } } : {}),
        ...(project ? { project: { name: { contains: project, mode: "insensitive" } } } : {})
      },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        customer: { select: { id: true, name: true } },
        project: { select: { id: true, name: true } },
        invoice: { select: { id: true, number: true, type: true } }
      }
    })

    const total = await prisma.documentAsset.count()
    const open = await prisma.documentAsset.count({ where: { status: "open" } })

    return NextResponse.json({
      ok: true,
      documents: documents.map(serializeDocument),
      cards: {
        total,
        recentUploads: documents.slice(0, 5).length,
        open
      }
    })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
