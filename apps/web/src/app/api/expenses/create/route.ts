import { NextResponse } from "next/server"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { writeAuditLog } from "@/lib/audit/log"

function parseMoney(value: unknown) {
  const amount = Number(String(value || "0").trim().replace(",", "."))
  return Number.isFinite(amount) ? amount : Number.NaN
}

function expenseFromData(data: Record<string, unknown>) {
  const amount = parseMoney(data.amount)
  const title = String(data.title || "").trim() || "Premium Ausgabe"

  return {
    id: "expense-" + Date.now(),
    title,
    category: String(data.category || "").trim() || "Software",
    project: String(data.project || "").trim() || "Allgemein",
    vendor: String(data.vendor || "").trim() || "Lieferant",
    amount: Number.isFinite(amount) && amount >= 0 ? amount : 0,
    status: String(data.status || "").trim() || "recorded",
    date: new Date().toISOString()
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

    await writeAuditLog({
      action: "premium.expense.create",
      entity: "premium_expense",
      entityId: expense.id,
      reason: "Premium Ausgabe erstellt",
      data: expense
    })

    return NextResponse.json({ ok: true, expense })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { ok: false, error: "Ausgabe konnte nicht gespeichert werden." },
      { status: 500 }
    )
  }
}
