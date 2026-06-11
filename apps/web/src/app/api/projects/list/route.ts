import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { projects as fallbackProjects } from "@/data/invoice-data"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function formatBudget(value: unknown) {
  const amount = Number(value ?? 0)
  return `${Number.isFinite(amount) ? amount.toFixed(2).replace(".", ",") : "0,00"} EUR`
}

function fallbackProjectRows() {
  return fallbackProjects.map((project, index) => ({
    id: project.id,
    code: `PR-${String(index + 1).padStart(4, "0")}`,
    name: project.name,
    customer: project.customer,
    status: project.status,
    progress: project.progress,
    budget: project.budget
  }))
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackProjectRows())
  }

  try {
    const projects = await prisma.project.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        customer: true
      }
    })

    return NextResponse.json(projects.map((project) => ({
      id: project.id,
      code: project.code,
      name: project.name,
      customer: project.customer?.name || "Ohne Kunde",
      status: project.status || "Aktiv",
      progress: "0%",
      budget: formatBudget(project.budget)
    })))
  } catch (error) {
    console.error(error)
    return NextResponse.json(fallbackProjectRows())
  }
}
