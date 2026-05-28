import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"

const MAX_ITEMS = 100
const MAX_MONEY = 999_999_999

function parseStrictNumber(value: unknown) {
  if (typeof value === "number") return Number.isFinite(value) ? value : Number.NaN
  if (typeof value !== "string") return Number.NaN

  const normalized = value.trim().replace(",", ".")
  if (!/^-?\d+(\.\d+)?$/.test(normalized)) return Number.NaN
  return Number(normalized)
}

function decimalSchema(label: string, options: { min?: number; max?: number } = {}) {
  return z.preprocess(
    parseStrictNumber,
    z.number({
      error: (issue) => issue.input === undefined
        ? label + " fehlt."
        : label + " muss eine gueltige Zahl sein."
    })
      .finite(label + " muss eine gueltige Zahl sein.")
      .min(options.min ?? 0, label + " darf nicht negativ sein.")
      .max(options.max ?? MAX_MONEY, label + " ist zu gross.")
  )
}

const invoiceItemSchema = z.object({
  name: z.string().trim().max(160, "Positionsname ist zu lang.").optional(),
  quantity: decimalSchema("Menge", { min: 0.01, max: 999_999 }),
  price: decimalSchema("Preis", { min: 0, max: MAX_MONEY }),
  category: z.string().trim().max(240, "Positionsbeschreibung ist zu lang.").nullable().optional()
})

const invoiceCreateSchema = z.object({
  date: z.coerce.date("Rechnungsdatum ist ungueltig.").optional(),
  dueDate: z.union([z.coerce.date("Faelligkeitsdatum ist ungueltig."), z.literal(""), z.null()]).optional(),
  note: z.string().trim().max(4_000, "Notiz ist zu lang.").optional(),
  customerId: z.string().trim().min(1).max(128).optional(),
  taxRate: decimalSchema("Steuersatz", { min: 0, max: 1 }).default(0.19),
  tip: decimalSchema("Zuschlag", { min: 0, max: MAX_MONEY }).default(0),
  items: z.array(invoiceItemSchema).max(MAX_ITEMS, "Zu viele Positionen.").default([])
})

function mapValidationError(error: z.ZodError) {
  return NextResponse.json(
    {
      ok: false,
      error: error.issues[0]?.message ?? "Ungueltige Rechnungsdaten.",
      code: "invalid_invoice_payload",
      issues: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message
      }))
    },
    { status: 400 }
  )
}

async function requireInvoicePermission(action: "create") {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diese Rechnungsaktion.", 403)
  }

  return user
}

async function parseRequestBody(req: Request) {
  try {
    return await req.json()
  } catch {
    throw new AuthServiceError("invalid_request", "Ungueltige JSON-Anfrage.", 400)
  }
}

export async function POST(req: Request) {
  try {
    const parsed = invoiceCreateSchema.safeParse(await parseRequestBody(req))

    if (!parsed.success) {
      return mapValidationError(parsed.error)
    }

    const data = parsed.data
    const items = data.items
    const dueDate = data.dueDate instanceof Date ? data.dueDate : null

    if (!process.env.DATABASE_URL) {
      const firstDemoDocument = documents[0]
      const netTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const vatTotal = netTotal * data.taxRate
      const grossTotal = netTotal + vatTotal + data.tip

      return NextResponse.json({
        success: true,
        invoice: {
          id: firstDemoDocument?.id ?? "demo-draft",
          number: "DI-DEMO-DRAFT",
          status: "draft",
          issueDate: (data.date ?? new Date()).toISOString(),
          dueDate: dueDate?.toISOString() ?? null,
          notes: data.note ?? null,
          netTotal,
          vatTotal,
          grossTotal
        },
        mode: "demo"
      })
    }

    await requireInvoicePermission("create")

    const invoice = await prisma.$transaction(async (tx) => {
      await tx.numberRange.upsert({
        where: { type: "invoice" },
        create: {
          type: "invoice",
          prefix: "RE-%Y-",
          nextValue: 104,
          padding: 3
        },
        update: {}
      })

      const range = await tx.numberRange.update({
        where: { type: "invoice" },
        data: { nextValue: { increment: 1 } }
      })

      const invoiceValue = range.nextValue - 1
      const padded = String(invoiceValue).padStart(range.padding, "0")
      const prefix = range.prefix.replace("%Y", String(new Date().getFullYear()))
      const invoiceNumber = prefix + padded

      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { id: true }
        })

        if (!customer) {
          throw new AuthServiceError("not_found", "Kunde wurde nicht gefunden.", 404)
        }
      }

      const netTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      const vatTotal = netTotal * data.taxRate
      const grossTotal = netTotal + vatTotal + data.tip

      return tx.invoice.create({
        data: {
          number: invoiceNumber,
          status: "draft",
          issueDate: data.date ?? new Date(),
          dueDate,
          notes: data.note ?? null,

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
              quantity: item.quantity,
              netPrice: item.price,
              vatRate: data.taxRate * 100,
              sortOrder: index
            }))
          }
        }
      })
    })

    return NextResponse.json({ success: true, invoice })
  } catch (err) {
    if (err instanceof AuthServiceError) {
      const mapped = mapAuthError(err)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    if (typeof err === "object" && err !== null && "code" in err && err.code === "P2025") {
      return NextResponse.json(
        { ok: false, error: "Verknuepfter Datensatz wurde nicht gefunden.", code: "not_found" },
        { status: 404 }
      )
    }

    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
