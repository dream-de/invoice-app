import { NextResponse } from "next/server"
import { prisma, type Prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

type InvoiceItemPayload = {
  name?: string
  label?: string
  quantity?: number | string
  price?: number | string
  category?: string | null
}

function toNumber(value: unknown) {
  return Number(String(value ?? 0).replace(",", ".")) || 0
}

function parseCustomerAddress(value: unknown) {
  const lines = String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  const street = lines[0] || ""
  const place = lines[1] || ""
  const placeMatch = place.match(/^(\d{4,6})\s+(.+)$/)

  return {
    street,
    zip: placeMatch?.[1] || "",
    city: placeMatch?.[2] || place
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const data = await req.json()
    const items = Array.isArray(data.items) ? data.items as InvoiceItemPayload[] : []
    const taxRate = toNumber(data.taxRate ?? 0.19)
    const tip = toNumber(data.tip)

    if (isDemoMode() || !process.env.DATABASE_URL) {
      const existingDemoDocument = documents.find((item) => item.id === id) ?? documents[0]
      const netTotal = items.reduce(
        (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
        0
      )
      const vatTotal = netTotal * taxRate
      const grossTotal = netTotal + vatTotal + tip

      return NextResponse.json(demoModeResponse({
        success: true,
        invoice: {
          id,
          number: typeof data.number === "string" && data.number.trim()
            ? data.number.trim()
            : existingDemoDocument?.number ?? "DI-DEMO-DRAFT",
          status: "draft",
          netTotal,
          vatTotal,
          grossTotal,
          customer: {
            name: typeof data.customerName === "string" && data.customerName.trim()
              ? data.customerName.trim()
              : existingDemoDocument?.customer ?? null,
            email: typeof data.customerEmail === "string" ? data.customerEmail : null
          },
          positions: items.map((item, index) => ({
            id: String(index + 1),
            title: item.name || item.label || "Position",
            description: item.category || null,
            quantity: toNumber(item.quantity) || 1,
            netPrice: toNumber(item.price),
            vatRate: taxRate * 100,
            sortOrder: index
          }))
        }
      }))
    }

    const existing = await prisma.invoice.findUnique({
      where: { id },
      include: { positions: true }
    })

    if (!existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      )
    }

    const netTotal = items.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity),
      0
    )

    const vatTotal = netTotal * taxRate
    const grossTotal = netTotal + vatTotal + tip

    const updated = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.invoicePosition.deleteMany({
        where: { invoiceId: id }
      })

      const customerName = typeof data.customerName === "string" ? data.customerName.trim() : ""
      const customerEmail = typeof data.customerEmail === "string" ? data.customerEmail.trim() : ""
      const customerAddress = parseCustomerAddress(data.customerAddress)
      const payloadCustomerId = typeof data.customerId === "string" && data.customerId.trim()
        ? data.customerId.trim()
        : ""
      let customerRelation: { connect: { id: string } } | { disconnect: true } | undefined = undefined

      if (customerName === "(Kein Kunde)") {
        customerRelation = { disconnect: true }
      } else if (customerName) {
        const customerData = {
          name: customerName,
          email: customerEmail || null,
          street: customerAddress.street || null,
          zip: customerAddress.zip || null,
          city: customerAddress.city || null
        }

        let customerId = payloadCustomerId || existing.customerId || ""

        if (!customerId) {
          const customerMatches = [
            customerEmail ? { email: customerEmail } : null,
            { name: customerName }
          ].filter(Boolean) as Array<{ email: string } | { name: string }>

          const matchedCustomer = await tx.customer.findFirst({
            where: { OR: customerMatches },
            orderBy: { createdAt: "desc" }
          })

          customerId = matchedCustomer?.id || ""
        }

        if (customerId) {
          await tx.customer.update({
            where: { id: customerId },
            data: customerData
          })
          customerRelation = { connect: { id: customerId } }
        } else {
          let nextNumberValue = await tx.customer.count() + 1
          let customerNumber = "KD-" + String(nextNumberValue).padStart(4, "0")

          while (await tx.customer.findUnique({ where: { number: customerNumber } })) {
            nextNumberValue += 1
            customerNumber = "KD-" + String(nextNumberValue).padStart(4, "0")
          }

          const customer = await tx.customer.create({
            data: {
              number: customerNumber,
              ...customerData,
              country: "Deutschland",
              status: "active"
            }
          })

          customerRelation = { connect: { id: customer.id } }
        }
      }

      return tx.invoice.update({
        where: { id },
        data: {
          number: typeof data.number === "string" && data.number.trim()
            ? data.number.trim()
            : existing.number,
          issueDate: data.date ? new Date(data.date) : existing.issueDate,
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
          notes: typeof data.note === "string" ? data.note : null,

          netTotal,
          vatTotal,
          grossTotal,

          customer: customerRelation,

          positions: {
            create: items.map((item, index) => ({
              title: item.name || item.label || "Position",
              description: item.category || null,
              quantity: toNumber(item.quantity) || 1,
              netPrice: toNumber(item.price),
              vatRate: taxRate * 100,
              sortOrder: index
            }))
          }
        },
        include: {
          positions: { orderBy: { sortOrder: "asc" } },
          customer: true
        }
      })
    })

    return NextResponse.json({ success: true, invoice: updated })
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    )
  }
}
