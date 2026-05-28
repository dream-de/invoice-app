import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import puppeteer from "puppeteer"
import * as QRCode from "qrcode"
import { createPdfContentDisposition, createPdfFileName } from "@dream-invoice/pdf"
import { pdfLayout } from "@/lib/pdf/layout"
import { calculatePdfInvoiceTotals } from "@/lib/pdf/invoice-totals"
import type { DocumentTemplate } from "@/lib/document-templates/types"
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants"
import { createSepaQrPayload } from "@/lib/payment/sepa-qr"
import { documents } from "@/data/invoice-data"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"

const APP_ROOT = process.cwd()
const LEGACY_TEMPLATE_PATH = path.join(APP_ROOT, "data", "default-template.json")
const TEMPLATES_PATH = path.join(APP_ROOT, "data", "templates.json")
const MAX_TEMPLATE_FILE_BYTES = 1_000_000
const MAX_TEMPLATE_ID_LENGTH = 128

type TemplateRecord = {
  id: string
  name: string
  type: "invoice" | "offer"
  active?: boolean
  data?: DocumentTemplate
}

type PdfInvoicePosition = {
  title: string
  quantity: unknown
  netPrice: unknown
  vatRate?: unknown
}

type PdfInvoice = {
  number: string
  issueDate: Date
  customer: {
    name?: string | null
    street?: string | null
    zip?: string | null
    city?: string | null
    country?: string | null
  } | null
  positions: PdfInvoicePosition[]
}

type PdfCompany = {
  company: string
  street: string | null
  zip: string | null
  city: string | null
  country: string | null
  vatId?: string | null
  taxNumber?: string | null
  owner?: string | null
  iban?: string | null
  bic?: string | null
  bankName?: string | null
}

function normalizeTemplate(data: Partial<DocumentTemplate> | undefined): DocumentTemplate {
  return {
    ...DEFAULT_INVOICE_TEMPLATE,
    ...data,
    page: data?.page ?? DEFAULT_INVOICE_TEMPLATE.page,
    elements: Array.isArray(data?.elements) && data.elements.length
      ? data.elements
      : DEFAULT_INVOICE_TEMPLATE.elements
  }
}

async function readJsonFileWithLimit(filePath: string) {
  const stat = await fs.stat(filePath)
  if (stat.size > MAX_TEMPLATE_FILE_BYTES) {
    throw new Error("Template-Datei ist zu gross.")
  }

  return fs.readFile(filePath, "utf8")
}

function normalizeTemplateId(value: string | null) {
  if (!value) return null
  const templateId = value.trim()
  if (!templateId) return null
  if (templateId.length > MAX_TEMPLATE_ID_LENGTH) {
    throw new AuthServiceError("invalid_request", "Template-ID ist zu lang.", 400)
  }

  return templateId
}

async function loadInvoiceTemplate(templateId: string | null): Promise<DocumentTemplate> {
  try {
    const raw = await readJsonFileWithLimit(TEMPLATES_PATH)
    const templates = JSON.parse(raw) as TemplateRecord[]
    const invoiceTemplates = templates.filter((template) => template.type === "invoice")
    const selected = templateId
      ? invoiceTemplates.find((template) => template.id === templateId)
      : invoiceTemplates.find((template) => template.active) ?? invoiceTemplates[0]

    if (selected) {
      return normalizeTemplate(selected.data ?? selected)
    }
  } catch {
    // Legacy fallback below keeps older local installs working.
  }

  try {
    const raw = await readJsonFileWithLimit(LEGACY_TEMPLATE_PATH)
    const data = JSON.parse(raw)
    return normalizeTemplate(data)
  } catch {
    return DEFAULT_INVOICE_TEMPLATE
  }
}

function replacePaymentPlaceholders(content: string | undefined, invoiceNumber: string) {
  return String(content || "Rechnung {{number}}").replaceAll("{{number}}", invoiceNumber)
}

function fallbackCompany(): PdfCompany {
  return {
    company: "Dream Invoice",
    street: "Lindenallee 42",
    zip: "50667",
    city: "Koeln",
    country: "Deutschland",
    vatId: null,
    taxNumber: null,
    owner: null,
    iban: null,
    bic: null,
    bankName: null
  }
}

function fallbackInvoice(id: string): PdfInvoice | null {
  const document = documents.find((item) => item.id === id)

  if (!document) return null

  return {
    number: document.number,
    issueDate: new Date(document.issueDate),
    customer: {
      name: document.customer,
      street: document.customerStreet,
      zip: document.customerZip,
      city: document.customerCity,
      country: "Deutschland"
    },
    positions: document.items.map((item) => ({
      title: item.title,
      quantity: item.quantity,
      netPrice: item.netPrice,
      vatRate: 19
    }))
  }
}

async function requireInvoicePdfPermission() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "documents", "pdf")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer dieses Rechnungs-PDF.", 403)
  }

  return user
}

async function loadPdfSource(id: string): Promise<{ invoice: PdfInvoice; company: PdfCompany } | null> {
  if (!process.env.DATABASE_URL) {
    const invoice = fallbackInvoice(id)
    return invoice ? { invoice, company: fallbackCompany() } : null
  }

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        positions: { orderBy: { sortOrder: "asc" } },
        customer: true
      }
    })

    if (!invoice) return null

    const companySettings = await prisma.companySettings.findFirst()

    return {
      invoice,
      company: companySettings ?? fallbackCompany()
    }
  } catch (error) {
    console.error("PDF source loading failed.", { invoiceId: id, error })
    throw error
  }
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const { searchParams } = new URL(req.url)

  try {
    if (process.env.DATABASE_URL) {
      await requireInvoicePdfPermission()
    }

    const templateId = normalizeTemplateId(searchParams.get("templateId"))
    const source = await loadPdfSource(id)

    if (!source) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      )
    }

    const { invoice, company } = source

    const { subtotal, taxTotal, total, positions } = calculatePdfInvoiceTotals(invoice.positions)

    const template = await loadInvoiceTemplate(templateId)
    const qrElement = template.elements.find((element) => element.type === "paymentQr")
    const paymentNote = replacePaymentPlaceholders(qrElement?.content, invoice.number)

    const paymentQrDataUrl =
      company.iban && company.company && qrElement
        ? await QRCode.toDataURL(
            createSepaQrPayload({
              beneficiaryName: company.company,
              iban: company.iban,
              bic: company.bic,
              amount: total,
              remittance: paymentNote
            }),
            {
              errorCorrectionLevel: "M",
              margin: 1,
              width: Math.max(96, qrElement.width * 2)
            }
          )
        : null

    const html = pdfLayout({
      title: "Rechnung",
      number: invoice.number,
      date: invoice.issueDate.toLocaleDateString("de-DE"),
      customer: invoice.customer,
      company,
      positions,
      subTotal: subtotal,
      vatAmount: taxTotal,
      total,
      template,
      paymentQrDataUrl,
      paymentNote
    })

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"]
    })

    try {
      const page = await browser.newPage()
      await page.setContent(html, { waitUntil: "load" })

      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        preferCSSPageSize: true
      })

      const disposition = searchParams.get("inline") === "1" || searchParams.get("download") === "0" ? "inline" : "attachment"
      const fileName = createPdfFileName(invoice.number)

      return new NextResponse(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": createPdfContentDisposition(disposition, fileName),
          "Cache-Control": "no-store"
        }
      })
    } finally {
      await browser.close().catch(() => undefined)
    }
  } catch (err) {
    if (err instanceof AuthServiceError) {
      const mapped = mapAuthError(err)
      return NextResponse.json(
        { ok: false, error: mapped.error, code: mapped.code },
        { status: mapped.status }
      )
    }

    console.error("PDF generation failed.", { invoiceId: id, error: err })
    return NextResponse.json({ error: "PDF error" }, { status: 500 })
  }
}
