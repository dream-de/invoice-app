import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { writeAuditLog } from "@/lib/audit/log"

function parseMoney(value: unknown) {
  const amount = Number(String(value || "0").trim().replace(",", "."))
  return Number.isFinite(amount) ? amount : Number.NaN
}

function expenseFromData(data: Record<string, unknown>) {
  const amount = parseMoney(data.amount)
  const title = String(data.title || "").trim() || "Premium Ausgabe"
  const attachmentId = String(data.attachmentId || "").trim() || null

  return {
    id: "expense-" + Date.now(),
    title,
    category: String(data.category || "").trim() || "Software",
    project: String(data.project || "").trim() || "Allgemein",
    vendor: String(data.vendor || "").trim() || "Lieferant",
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    status: String(data.status || "").trim() || "recorded",
    date: new Date().toISOString(),
    attachmentId
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const expense = expenseFromData(data)

    if (!expense.title || expense.amount <= 0) {
      return NextResponse.json(
        { ok: false, error: "Ausgabe oder Betrag fehlt." },
        { status: 400 }
      )
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true, expense }))
    }

    const project = await prisma.project.findFirst({
      where: { name: expense.project }
    })

    const savedExpense = await prisma.$transaction(async (tx) => {
      const created = await tx.expense.create({
        data: {
          projectId: project?.id ?? null,
          projectName: expense.project,
          title: expense.title,
          category: expense.category,
          vendor: expense.vendor,
          amount: expense.amount,
          status: expense.status,
          date: new Date(expense.date)
        }
      })

      if (expense.attachmentId) {
        const attachment = await tx.attachment.findUnique({ where: { id: expense.attachmentId } })
        if (!attachment) {
          throw new Error("attachment_not_found")
        }
        if (attachment.expenseId && attachment.expenseId !== created.id) {
          throw new Error("attachment_already_linked")
        }
        await tx.attachment.update({
          where: { id: expense.attachmentId },
          data: { expenseId: created.id }
        })
      }

      return created
    })

    const responseExpense = {
      ...expense,
      id: savedExpense.id,
      date: savedExpense.date.toISOString(),
      attachmentId: expense.attachmentId
    }

    await writeAuditLog({
      action: "premium.expense.create",
      entity: "premium_expense",
      entityId: savedExpense.id,
      reason: "Premium Ausgabe erstellt",
      data: responseExpense
    })

    return NextResponse.json({ ok: true, expense: responseExpense })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "attachment_not_found") {
        return NextResponse.json({ ok: false, error: "Beleg wurde nicht gefunden." }, { status: 404 })
      }
      if (error.message === "attachment_already_linked") {
        return NextResponse.json({ ok: false, error: "Beleg ist bereits mit einer anderen Ausgabe verknuepft." }, { status: 409 })
      }
    }

    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Ausgabe konnte nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
