import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"

type InvoiceItemPayload = {
  name?: string
  quantity?: number | string
  price?: number | string
  category?: string | null
}

function toNumber(value: unknown) {
  return Number(String(value ?? 0).replace(",", ".")) || 0
}

export async function POST(req: Request) {
  try {
    const data = await req.json()
    const items = Array.isArray(data.items) ? data.items as InvoiceItemPayload[] : []
    const taxRate = toNumber(data.taxRate ?? 0.19)
    const tip = toNumber(data.tip)

    const range = await prisma.numberRange.upsert({
      where: { type: "invoice" },
      create: {
        type: "invoice",
        prefix: "RE-%Y-",
        nextValue: 104,
        padding: 3
      },
      update: {}
    })

    const padded = String(range.nextValue).padStart(range.padding, "0")
    const prefix = range.prefix.replace("%Y", String(new Date().getFullYear()))
    const invoiceNumber = prefix + padded

    const netTotal = items.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
      0
    )

    const vatTotal = netTotal * taxRate
    const grossTotal = netTotal + vatTotal + tip

    const invoice = await prisma.invoice.create({
      data: {
        number: invoiceNumber,
        status: "draft",
        issueDate: data.date ? new Date(data.date) : new Date(),
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        notes: typeof data.note === "string" ? data.note : null,

        customer: data.customerId
          ? { connect: { id: data.customerId } }
          : undefined,

        netTotal,
        vatTotal,
        grossTotal,

        positions: {
          create: items.map((item, index) => ({
            title: item.name || "Neue Position",
            description: item.category || null,
            quantity: toNumber(item.quantity) || 1,
            netPrice: toNumber(item.price),
            vatRate: taxRate * 100,
            sortOrder: index
          }))
        }
      }
    })

    await prisma.numberRange.update({
      where: { type: "invoice" },
      data: { nextValue: range.nextValue + 1 }
    })

    return NextResponse.json({ success: true, invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
