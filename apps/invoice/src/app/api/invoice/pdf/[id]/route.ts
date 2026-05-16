import { promises as fs } from "fs"
import path from "path"
import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"
import puppeteer from "puppeteer"
import * as QRCode from "qrcode"
import { pdfLayout } from "@/lib/pdf/layout"
import type { DocumentTemplate } from "@/lib/document-templates/types"
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants"
import { createSepaQrPayload } from "@/lib/payment/sepa-qr"

const APP_ROOT = process.cwd()
const TEMPLATE_PATH = path.join(APP_ROOT, "data", "default-template.json")

async function loadDefaultTemplate(): Promise<DocumentTemplate> {
  try {
    const raw = await fs.readFile(TEMPLATE_PATH, "utf8")
    const data = JSON.parse(raw)
    return {
      ...DEFAULT_INVOICE_TEMPLATE,
      ...data,
      page: data.page ?? DEFAULT_INVOICE_TEMPLATE.page,
      elements: Array.isArray(data.elements) && data.elements.length
        ? data.elements
        : DEFAULT_INVOICE_TEMPLATE.elements
    }
  } catch {
    return DEFAULT_INVOICE_TEMPLATE
  }
}

function replacePaymentPlaceholders(content: string | undefined, invoiceNumber: string) {
  return String(content || "Rechnung {{number}}").replaceAll("{{number}}", invoiceNumber)
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        positions: { orderBy: { sortOrder: "asc" } },
        customer: true
      }
    })

    if (!invoice) {
      return NextResponse.json(
        { error: "Rechnung nicht gefunden" },
        { status: 404 }
      )
    }

    const companySettings = await prisma.companySettings.findFirst()

    const company = companySettings ?? {
      company: "Invoice Platform",
      street: null,
      zip: null,
      city: null,
      country: "Deutschland",
      vatId: null,
      taxNumber: null,
      owner: null,
      iban: null,
      bic: null,
      bankName: null
    }

    const subtotal = invoice.positions.reduce(
      (sum: number, p: any) => sum + Number(p.netPrice) * Number(p.quantity),
      0
    )

    const taxTotal = invoice.positions.reduce(
      (sum: number, p: any) =>
        sum +
        Number(p.netPrice) *
          Number(p.quantity) *
          (Number(p.vatRate) / 100),
      0
    )

    const total = subtotal + taxTotal

    const positions = invoice.positions.map((p: any) => ({
      title: p.title,
      quantity: Number(p.quantity),
      unitPrice: Number(p.netPrice)
    }))

    const template = await loadDefaultTemplate()
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

    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load" })

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true
    })

    await browser.close()

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="invoice.pdf"'
      }
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "PDF error" }, { status: 500 })
  }
}
