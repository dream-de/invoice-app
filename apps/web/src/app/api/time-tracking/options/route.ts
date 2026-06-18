import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { articles as fallbackArticles, customers as fallbackCustomers, projects as fallbackProjects } from "@/data/invoice-data"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

function fallbackOptions() {
  return {
    ok: true,
    customers: fallbackCustomers.map((customer) => ({
      id: customer.id,
      number: "KD-" + customer.id.padStart(4, "0"),
      name: customer.name
    })),
    projects: fallbackProjects.map((project, index) => ({
      id: project.id,
      code: "PR-" + String(index + 1).padStart(4, "0"),
      name: project.name,
      customerId: fallbackCustomers.find((customer) => customer.name === project.customer)?.id ?? null,
      customerName: project.customer
    })),
    articles: fallbackArticles.filter((article) => article.status !== "inactive").map((article) => ({
      id: article.id,
      code: article.code,
      name: article.name,
      unit: article.unit,
      price: Number(article.price)
    })),
    mode: "demo"
  }
}

export async function GET() {
  if (isDemoMode() || !process.env.DATABASE_URL) {
    return NextResponse.json(fallbackOptions())
  }

  try {
    const [customers, projects, articles] = await Promise.all([
      prisma.customer.findMany({
        where: { status: { not: "archived" } },
        orderBy: { name: "asc" },
        select: { id: true, number: true, name: true }
      }),
      prisma.project.findMany({
        where: { status: { not: "archived" } },
        orderBy: { name: "asc" },
        select: { id: true, code: true, name: true, customerId: true, customer: { select: { name: true } } }
      }),
      prisma.article.findMany({
        where: { active: true },
        orderBy: { name: "asc" },
        select: { id: true, number: true, name: true, unit: true, netPrice: true }
      })
    ])

    return NextResponse.json({
      ok: true,
      customers,
      projects: projects.map((project) => ({
        id: project.id,
        code: project.code,
        name: project.name,
        customerId: project.customerId,
        customerName: project.customer?.name ?? "Ohne Kunde"
      })),
      articles: articles.map((article) => ({
        id: article.id,
        code: article.number,
        name: article.name,
        unit: article.unit,
        price: Number(article.netPrice)
      }))
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(fallbackOptions())
  }
}
