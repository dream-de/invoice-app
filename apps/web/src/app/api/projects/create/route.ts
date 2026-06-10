import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

function projectResponse(project: {
  id: string
  code?: string | null
  name: string
  status?: string | null
  budget?: unknown
  customer?: { name?: string | null } | null
}) {
  return {
    id: project.id,
    code: project.code || project.id,
    name: project.name,
    customer: project.customer?.name || "Ohne Kunde",
    status: project.status || "Aktiv",
    progress: "0%",
    budget: project.budget ? `${String(project.budget).replace(".", ",")} EUR` : "0,00 EUR"
  }
}

function demoProjectFromData(data: Record<string, unknown>) {
  const code = String(data.code || "").trim() || "PR-DEMO-0001"
  return projectResponse({
    id: "demo-project-" + Date.now(),
    code,
    name: String(data.name || "").trim(),
    status: data.status ? String(data.status).trim() : "Aktiv",
    budget: data.budget ? String(data.budget).trim() : "0",
    customer: { name: data.customer ? String(data.customer).trim() : "Demo Kunde" }
  })
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const name = String(data.name || "").trim()

    if (name.length < 2) {
      return NextResponse.json(
        { error: "Projektname fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ok: true,
        project: demoProjectFromData(data)
      }))
    }

    const count = await prisma.project.count()
    const code = String(data.code || "").trim() || `PR-${String(count + 1).padStart(4, "0")}`
    const customerName = String(data.customer || "").trim()
    const customer = customerName
      ? await prisma.customer.findFirst({ where: { name: customerName } })
      : null
    const budgetValue = Number(String(data.budget || "0").replace(",", "."))

    const project = await prisma.project.create({
      data: {
        code,
        name,
        status: String(data.status || "Aktiv"),
        description: data.description ? String(data.description) : null,
        budget: Number.isFinite(budgetValue) ? budgetValue : null,
        customerId: customer?.id ?? null
      },
      include: {
        customer: true
      }
    })

    return NextResponse.json({ ok: true, project: projectResponse(project) })
  } catch (error: any) {
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "Projektnummer existiert bereits." },
        { status: 409 }
      )
    }

    console.error(error)

    return NextResponse.json(
      { error: "Projekt konnte nicht erstellt werden." },
      { status: 500 }
    )
  }
}
