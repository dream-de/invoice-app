import { NextResponse } from "next/server"
import { prisma, type Prisma } from "@dream-invoice/database"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

type InvoiceItemPayload = {
  name?: string
  label?: string
  quantity?: number | string
  price?: number | string
  category?: string | null
  vatRate?: number | string
  customerId?: string | null
  projectId?: string | null
  articleId?: string | null
  hours?: number | string | null
  hourlyRate?: number | string | null
  amount?: number | string | null
}

function nullableRelationId(value: string | null | undefined) {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized || null
}

function toNumber(value: unknown) {
  return Number(String(value ?? 0).replace(",", ".")) || 0
}

function itemVatRate(item: InvoiceItemPayload, fallbackRate: number) {
  const rate = toNumber(item.vatRate ?? fallbackRate * 100)
  return Number.isFinite(rate) ? rate : fallbackRate * 100
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

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requireInvoiceEditPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
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
      const vatTotal = items.reduce(
        (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity) * (itemVatRate(item, taxRate) / 100),
        0
      )
      const grossTotal = netTotal + vatTotal + tip

      return NextResponse.json(demoModeResponse({
        success: true,
        invoice: {
          id,
          number: typeof data.number === "string" && data.number.trim()
            ? data.number.trim()
            : existingDemoDocument?.number ?? "DI-DEMO-DRAFT",
          status: typeof data.status === "string" ? data.status : "draft",
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
            vatRate: itemVatRate(item, taxRate),
            sortOrder: index
          }))
        }
      }))
    }

    await requireInvoiceEditPermission()

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

    const vatTotal = items.reduce(
      (sum, item) => sum + toNumber(item.price) * toNumber(item.quantity) * (itemVatRate(item, taxRate) / 100),
      0
    )
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
          status: typeof data.status === "string" ? data.status : existing.status,
          paidAt: typeof data.status === "string"
            ? (data.status === "paid" ? existing.paidAt ?? new Date() : null)
            : existing.paidAt,

          netTotal,
          vatTotal,
          grossTotal,

          customer: customerRelation,

          positions: {
            create: items.map((item, index) => {
              const quantity = toNumber(item.quantity) || 1
              const price = toNumber(item.price)
              const hours = item.hours == null ? null : toNumber(item.hours)
              const hourlyRate = item.hourlyRate == null ? null : toNumber(item.hourlyRate)

              return {
                customerId: nullableRelationId(item.customerId) ?? existing.customerId,
                projectId: nullableRelationId(item.projectId) ?? existing.projectId,
                articleId: nullableRelationId(item.articleId),
                title: item.name || item.label || "Position",
                description: item.category || null,
                quantity,
                unit: hours != null ? "Std" : "Stk",
                hours,
                hourlyRate,
                amount: item.amount == null ? price * quantity : toNumber(item.amount),
                netPrice: price,
                vatRate: itemVatRate(item, taxRate),
                sortOrder: index
              }
            })
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
    const authError = authErrorResponse(err)
    if (authError) return authError

    console.error(err)
    return NextResponse.json(
      { error: "Update failed" },
      { status: 500 }
    )
  }
}
