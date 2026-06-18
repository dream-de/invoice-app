import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { z } from "zod"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { appendNotification } from "@/lib/notifications/store"
import { createSepaQrPayload } from "@/lib/payment/sepa-qr"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

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
  customerId: z.string().trim().max(128).nullable().optional(),
  projectId: z.string().trim().max(128).nullable().optional(),
  articleId: z.string().trim().max(128).nullable().optional(),
  hours: decimalSchema("Stunden", { min: 0, max: 999_999 }).nullable().optional(),
  hourlyRate: decimalSchema("Stundensatz", { min: 0, max: MAX_MONEY }).nullable().optional(),
  amount: decimalSchema("Betrag", { min: 0, max: MAX_MONEY }).nullable().optional(),
  quantity: decimalSchema("Menge", { min: 0.01, max: 999_999 }),
  price: decimalSchema("Preis", { min: 0, max: MAX_MONEY }),
  category: z.string().trim().max(240, "Positionsbeschreibung ist zu lang.").nullable().optional(),
  vatRate: decimalSchema("Steuersatz", { min: 0, max: 100 }).optional()
})

const invoiceCreateSchema = z.object({
  number: z.string().trim().max(64, "Rechnungsnummer ist zu lang.").optional(),
  date: z.coerce.date("Rechnungsdatum ist ungueltig.").optional(),
  dueDate: z.union([z.coerce.date("Faelligkeitsdatum ist ungueltig."), z.literal(""), z.null()]).optional(),
  note: z.string().trim().max(4_000, "Notiz ist zu lang.").optional(),
  status: z.enum(["draft", "open", "paid", "overdue"]).optional(),
  customerId: z.string().trim().min(1).max(128).optional(),
  customerName: z.string().trim().max(180, "Kundenname ist zu lang.").optional(),
  customerEmail: z.string().trim().max(180, "Kunden-E-Mail ist zu lang.").optional(),
  customerAddress: z.string().trim().max(1_000, "Kundenadresse ist zu lang.").optional(),
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

function nullableRelationId(value: string | null | undefined) {
  const normalized = typeof value === "string" ? value.trim() : ""
  return normalized || null
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

export async function POST(req: Request) {
  try {
    const parsed = invoiceCreateSchema.safeParse(await parseRequestBody(req))

    if (!parsed.success) {
      return mapValidationError(parsed.error)
    }

    const data = parsed.data
    const items = data.items
    const demoDueDate = data.dueDate instanceof Date ? data.dueDate : null

    if (isDemoMode() || !process.env.DATABASE_URL) {
      const firstDemoDocument = documents[0]
      const netTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )
      const vatTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity * ((item.vatRate ?? data.taxRate * 100) / 100),
        0
      )
      const grossTotal = netTotal + vatTotal + data.tip

      return NextResponse.json(demoModeResponse({
        success: true,
        invoice: {
          id: firstDemoDocument?.id ?? "demo-draft",
          number: data.number || "DI-DEMO-DRAFT",
          status: data.status ?? "draft",
          issueDate: (data.date ?? new Date()).toISOString(),
          paidAt: data.status === "paid" ? new Date().toISOString() : null,
          dueDate: demoDueDate?.toISOString() ?? null,
          notes: data.note ?? null,
          netTotal,
          vatTotal,
          grossTotal
        }
      }))
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
      let invoiceNumber = prefix + padded
      const requestedNumber = data.number?.trim()

      if (requestedNumber) {
        const existingNumber = await tx.invoice.findUnique({
          where: { number: requestedNumber },
          select: { id: true }
        })

        if (!existingNumber) {
          invoiceNumber = requestedNumber
        }
      }

      if (data.customerId) {
        const customer = await tx.customer.findUnique({
          where: { id: data.customerId },
          select: { id: true }
        })

        if (!customer) {
          throw new AuthServiceError("not_found", "Kunde wurde nicht gefunden.", 404)
        }
      }

      const customerName = data.customerName?.trim() ?? ""
      const customerEmail = data.customerEmail?.trim() ?? ""
      const customerAddress = parseCustomerAddress(data.customerAddress)
      let customerId = data.customerId ?? ""

      if (!customerId && customerName) {
        const customerMatches = [
          customerEmail ? { email: customerEmail } : null,
          { name: customerName }
        ].filter(Boolean) as Array<{ email: string } | { name: string }>

        const matchedCustomer = await tx.customer.findFirst({
          where: { OR: customerMatches },
          orderBy: { createdAt: "desc" }
        })

        if (matchedCustomer) {
          customerId = matchedCustomer.id
          await tx.customer.update({
            where: { id: matchedCustomer.id },
            data: {
              name: customerName,
              email: customerEmail || null,
              street: customerAddress.street || null,
              zip: customerAddress.zip || null,
              city: customerAddress.city || null
            }
          })
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
              name: customerName,
              email: customerEmail || null,
              street: customerAddress.street || null,
              zip: customerAddress.zip || null,
              city: customerAddress.city || null,
              country: "Deutschland",
              status: "active"
            }
          })

          customerId = customer.id
        }
      }

      const companySettings = await tx.companySettings.findFirst({
        orderBy: { createdAt: "desc" },
        select: { id: true, company: true, defaultPaymentTermsDays: true }
      })
      const defaultBankAccount = companySettings
        ? await tx.bankAccount.findFirst({
            where: { companySettingsId: companySettings.id, active: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }]
          })
        : null
      const customerPaymentTerms = customerId
        ? await tx.customer.findUnique({
            where: { id: customerId },
            select: { preferredPaymentMethod: true, paymentTermsDays: true }
          })
        : null
      const rawPaymentTermsDays = Number(customerPaymentTerms?.paymentTermsDays ?? companySettings?.defaultPaymentTermsDays ?? 14)
      const paymentTermsDays = Number.isFinite(rawPaymentTermsDays) && rawPaymentTermsDays >= 0 ? rawPaymentTermsDays : 14
      const dueDate = data.dueDate instanceof Date
        ? data.dueDate
        : data.dueDate === "" || data.dueDate == null
          ? new Date(Date.now() + paymentTermsDays * 24 * 60 * 60 * 1000)
          : null

      const netTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      )

      const vatTotal = items.reduce(
        (sum, item) => sum + item.price * item.quantity * ((item.vatRate ?? data.taxRate * 100) / 100),
        0
      )
      const grossTotal = netTotal + vatTotal + data.tip
      const paymentMethod = customerPaymentTerms?.preferredPaymentMethod || "bank_transfer"
      const qrPaymentPayload = defaultBankAccount?.qrEnabled && defaultBankAccount.iban
        ? createSepaQrPayload({
            beneficiaryName: defaultBankAccount.accountHolder || companySettings?.company || "DreamInvoice",
            iban: defaultBankAccount.iban,
            bic: defaultBankAccount.bic,
            amount: grossTotal,
            remittance: "Rechnung " + invoiceNumber
          })
        : null

      return tx.invoice.create({
        data: {
          number: invoiceNumber,
          status: data.status ?? "draft",
          issueDate: data.date ?? new Date(),
          dueDate,
          paidAt: data.status === "paid" ? new Date() : null,
          notes: data.note ?? null,
          bankAccount: defaultBankAccount ? { connect: { id: defaultBankAccount.id } } : undefined,
          bankNameSnapshot: defaultBankAccount?.bankName ?? null,
          accountHolderSnapshot: defaultBankAccount?.accountHolder ?? null,
          ibanSnapshot: defaultBankAccount?.iban ?? null,
          bicSnapshot: defaultBankAccount?.bic ?? null,
          paymentMethod,
          paymentTermsDays,
          qrPaymentPayload,

          customer: data.customerId
            ? { connect: { id: data.customerId } }
            : customerId
            ? { connect: { id: customerId } }
            : undefined,

          netTotal,
          vatTotal,
          grossTotal,

          positions: {
            create: items.map((item, index) => ({
              customerId: nullableRelationId(item.customerId) ?? (customerId || null),
              projectId: nullableRelationId(item.projectId),
              articleId: nullableRelationId(item.articleId),
              title: item.name || "Neue Position",
              description: item.category || null,
              quantity: item.quantity,
              unit: item.hours != null ? "Std" : "Stk",
              hours: item.hours ?? null,
              hourlyRate: item.hourlyRate ?? null,
              amount: item.amount ?? item.price * item.quantity,
              netPrice: item.price,
              vatRate: item.vatRate ?? data.taxRate * 100,
              sortOrder: index
            }))
          }
        }
      })
    })

    await appendNotification({
      category: "documents",
      tone: "info",
      title: "Neue Rechnung erstellt",
      message: invoice.number + " wurde gespeichert.",
      href: "/documents/" + invoice.id,
      source: "invoice-created:" + invoice.id
    }).catch(() => null)

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
