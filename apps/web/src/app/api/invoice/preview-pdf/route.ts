import { promises as fs } from "fs"
import os from "os"
import path from "path"
import { NextResponse } from "next/server"
import puppeteer from "puppeteer"
import QRCode from "qrcode"
import { z } from "zod"

const MAX_ITEMS = 100

const invoiceItemSchema = z.object({
  description: z.string().trim().max(240).default("Position"),
  quantity: z.coerce.number().finite().min(0).max(999_999).default(0),
  unit: z.string().trim().max(24).default("Std."),
  price: z.coerce.number().finite().min(0).max(999_999_999).default(0),
  vatRate: z.coerce.number().finite().min(0).max(100).default(19)
})

const previewPdfSchema = z.object({
  template: z.enum(["classic", "modern", "minimal", "elegant", "business", "premium"]).default("classic"),
  customer: z.string().trim().max(180).default("Kunde"),
  customerAddress: z.string().trim().max(1_000).default(""),
  number: z.string().trim().max(64).default("RE-ENTWURF"),
  issueDate: z.string().trim().max(32).default(""),
  dueDate: z.string().trim().max(32).default(""),
  servicePeriod: z.string().trim().max(120).default(""),
  subject: z.string().trim().max(240).default(""),
  paymentTerms: z.string().trim().max(500).default("Zahlbar innerhalb von 14 Tagen ohne Abzug."),
  paymentMethod: z.string().trim().max(160).default("Ueberweisung"),
  paymentInstructions: z.string().trim().max(800).default(""),
  companyName: z.string().trim().max(180).default("DreamInvoice GmbH"),
  companyBankName: z.string().trim().max(180).default("Manuelle Bankdaten"),
  companyIban: z.string().trim().max(64).default("DE97441523700000069757"),
  companyBic: z.string().trim().max(64).default("WELADED1LUN"),
  note: z.string().trim().max(800).default(""),
  items: z.array(invoiceItemSchema).max(MAX_ITEMS).default([])
})

type PreviewPdfPayload = z.infer<typeof previewPdfSchema>

function resolveCreditor(data: PreviewPdfPayload) {
  return {
    name: data.companyName || "DreamInvoice GmbH",
    bankName: data.companyBankName || "Manuelle Bankdaten",
    iban: data.companyIban || "DE97441523700000069757",
    bic: data.companyBic || "WELADED1LUN"
  }
}

function formatMultilineHtml(value: string) {
  return escapeHtml(value).replaceAll("\n", "<br />")
}

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function euro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(Number.isFinite(value) ? value : 0)
}

function formatDate(value: string) {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat("de-DE").format(date)
}

function invoiceFileName(number: string) {
  return `${number.trim().replace(/[^A-Za-z0-9_.-]+/g, "-") || "rechnung"}.pdf`
}

function itemNet(item: PreviewPdfPayload["items"][number]) {
  return Math.max(item.quantity, 0) * Math.max(item.price, 0)
}

function totalsFor(items: PreviewPdfPayload["items"]) {
  const taxMap = new Map<number, { rate: number; net: number; tax: number }>()
  let net = 0
  let tax = 0

  for (const item of items) {
    const lineNet = itemNet(item)
    const lineTax = lineNet * (item.vatRate / 100)
    net += lineNet
    tax += lineTax

    const current = taxMap.get(item.vatRate) ?? { rate: item.vatRate, net: 0, tax: 0 }
    current.net += lineNet
    current.tax += lineTax
    taxMap.set(item.vatRate, current)
  }

  return {
    net,
    tax,
    gross: net + tax,
    taxes: Array.from(taxMap.values()).sort((a, b) => b.rate - a.rate)
  }
}

function epcAmount(value: number) {
  return `EUR${Math.max(value, 0).toFixed(2)}`
}

function epcPayload(invoiceNumber: string, amount: number, creditor: ReturnType<typeof resolveCreditor>) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    creditor.bic,
    creditor.name,
    creditor.iban,
    epcAmount(amount),
    "",
    "",
    invoiceNumber,
    `Rechnung ${invoiceNumber}`
  ].join("\n")
}

async function qrCodeFor(invoiceNumber: string, amount: number, creditor: ReturnType<typeof resolveCreditor>) {
  return QRCode.toDataURL(epcPayload(invoiceNumber, amount, creditor), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 164,
    color: { dark: "#111827", light: "#ffffff" }
  })
}

function renderClassicInvoiceHtml(data: PreviewPdfPayload, qrCodeUrl: string) {
  const totals = totalsFor(data.items)
  const creditor = resolveCreditor(data)
  const addressLines = data.customerAddress.split("\n").map((line) => line.trim()).filter(Boolean)
  const rows = data.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="right">${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "Std.")}</td>
      <td class="right">${euro(item.price)}</td>
      <td class="right">${escapeHtml(item.vatRate)}%</td>
      <td class="right strong">${euro(itemNet(item))}</td>
    </tr>
  `).join("")
  const taxRows = totals.taxes.map((entry) => `
    <div><span>${escapeHtml(entry.rate)}% MwSt auf ${euro(entry.net)}</span><strong>${euro(entry.tax)}</strong></div>
  `).join("")

  return `<!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoiceFileName(data.number))}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #172033;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 9px;
            line-height: 1.38;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            display: flex;
            flex-direction: column;
            padding: 14mm 17mm 10mm;
          }
          h1, h2, h3, p { margin: 0; }
          .title {
            text-align: center;
            margin-bottom: 28mm;
          }
          .title h1 {
            font-size: 17px;
            letter-spacing: 0;
          }
          .meta {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            align-items: start;
          }
          .recipient strong,
          .company strong {
            display: block;
            color: #6d4aff;
            margin: 3px 0 8px;
            font-size: 10px;
          }
          .label,
          .footer span {
            color: #6b778d;
            font-weight: 700;
          }
          .company {
            text-align: right;
          }
          .info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 18mm;
            margin-top: 16mm;
            align-items: start;
          }
          .subject {
            font-weight: 800;
          }
          .subject .label {
            display: block;
            margin-bottom: 3px;
          }
          .facts {
            text-align: right;
          }
          .facts div {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 2px;
          }
          table {
            width: 100%;
            margin-top: 10mm;
            border-collapse: collapse;
          }
          th {
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: #fff;
            padding: 6px 8px;
            text-align: left;
            font-size: 8px;
          }
          td {
            border-bottom: 1px solid #e4eaf3;
            padding: 7px 8px;
            vertical-align: top;
          }
          .right { text-align: right; }
          .strong { font-weight: 900; }
          .totals {
            width: 74mm;
            margin: 8mm 0 0 auto;
          }
          .totals div,
          .totals .grand {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 4px 0;
          }
          .totals .grand {
            margin-top: 3px;
            background: #efeaff;
            color: #5f3df5;
            padding: 5px 8px;
            font-size: 14px;
            font-weight: 900;
          }
          .payment {
            display: grid;
            grid-template-columns: 1fr 28mm;
            gap: 10mm;
            align-items: end;
            margin-top: 8mm;
            padding-top: 7mm;
            border-top: 1px solid #d8e1ee;
          }
          .payment h3 {
            color: #d64a4a;
            font-size: 9px;
            margin-bottom: 3mm;
          }
          .payment p { margin-bottom: 2mm; }
          .qr { text-align: center; }
          .qr img { width: 27mm; height: 27mm; }
          .qr small { display: block; font-size: 7px; font-weight: 800; color: #6b778d; }
          .bottom {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            margin-top: 7mm;
          }
          .bottom strong { display: block; margin-bottom: 2mm; }
          .thanks {
            margin-top: 6mm;
            text-align: center;
            font-weight: 800;
          }
          .footer {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 5mm;
            margin-top: auto;
            padding-top: 4mm;
            border-top: 1px solid #d8e1ee;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="title">
            <h1>RECHNUNG</h1>
          </header>

          <section class="meta">
            <section class="recipient">
              <span class="label">Rechnung an</span>
              <strong>${escapeHtml(data.customer)}</strong>
              <p>${addressLines.map(escapeHtml).join("<br />")}</p>
            </section>
            <section class="company">
              <span class="label">Rechnungssteller</span>
              <strong>${escapeHtml(creditor.name)}</strong>
            </section>
          </section>

          <section class="info">
            <section class="subject">
              <span class="label">Betreff</span>
              ${escapeHtml(data.subject)}
            </section>
            <section class="facts">
              <div><span>Rechnungsdatum:</span><strong>${escapeHtml(formatDate(data.issueDate))}</strong></div>
              <div><span>Faelligkeitsdatum:</span><strong>${escapeHtml(formatDate(data.dueDate))}</strong></div>
              <div><span>Leistungszeitraum:</span><strong>${escapeHtml(data.servicePeriod)}</strong></div>
              <div><span>Rechnungsnummer:</span><strong>${escapeHtml(data.number)}</strong></div>
            </section>
          </section>

          <table>
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th class="right">Menge</th>
                <th class="right">Preis (netto)</th>
                <th class="right">MwSt.</th>
                <th class="right">Gesamt (netto)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <section class="totals">
            <div><span>Netto</span><strong>${euro(totals.net)}</strong></div>
            ${taxRows}
            <div class="grand"><span>Gesamt</span><strong>${euro(totals.gross)}</strong></div>
          </section>

          <section class="payment">
            <div>
              <h3>Zahlungsart: ${escapeHtml(data.paymentMethod)}</h3>
              <p>Bitte ueberweisen Sie den offenen Betrag unter Angabe des Verwendungszwecks ${escapeHtml(data.number)} auf unser unten angegebenes Konto.</p>
              <p><strong>Bankverbindung:</strong><br />${escapeHtml(creditor.name)}<br />IBAN: ${escapeHtml(creditor.iban)}<br />BIC: ${escapeHtml(creditor.bic)}</p>
              ${data.paymentInstructions ? `<p><strong>Zahlungshinweis:</strong><br />${formatMultilineHtml(data.paymentInstructions)}</p>` : ""}
              <p>Sie koennen auch den QR-GiroCode auf der rechten Seite nutzen, um die Zahlung einfach und unkompliziert ueber Ihre Online-Banking-App durchzufuehren.</p>
              <p><strong>Bitte beachten:</strong><br />Die Rechnung wird nach Zahlungseingang automatisch als bezahlt markiert.</p>
            </div>
            <div class="qr"><img src="${qrCodeUrl}" alt="GiroCode" /><small>GiroCode scannen</small></div>
          </section>

          <section class="bottom">
            <div><strong>Zahlungsbedingungen</strong><span>${escapeHtml(data.paymentTerms)}</span></div>
          </section>
          <p class="thanks">${escapeHtml(data.note)}</p>
          <footer class="footer">
            <span>TEL: 030 88 99300</span>
            <span>info@dreaminvoice.de</span>
            <span>www.dreaminvoice.de</span>
            <span>USt-IdNr.: DE123456789</span>
          </footer>
        </main>
      </body>
    </html>`
}

function renderModernInvoiceHtml(data: PreviewPdfPayload, qrCodeUrl: string) {
  const totals = totalsFor(data.items)
  const creditor = resolveCreditor(data)
  const addressLines = data.customerAddress.split("\n").map((line) => line.trim()).filter(Boolean)
  const rows = data.items.map((item) => `
    <tr>
      <td>${escapeHtml(item.description)}</td>
      <td class="right">${escapeHtml(item.quantity)} ${escapeHtml(item.unit || "Std.")}</td>
      <td class="right">${euro(item.price)}</td>
      <td class="right">${escapeHtml(item.vatRate)}%</td>
      <td class="right strong">${euro(itemNet(item))}</td>
    </tr>
  `).join("")
  const taxRows = totals.taxes.map((entry) => `
    <div><span>${escapeHtml(entry.rate)}% MwSt auf ${euro(entry.net)}</span><strong>${euro(entry.tax)}</strong></div>
  `).join("")

  return `<!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(invoiceFileName(data.number))}</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            background: #fff;
            color: #172033;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 10px;
            line-height: 1.38;
          }
          .page {
            width: 210mm;
            min-height: 297mm;
            display: flex;
            flex-direction: column;
            padding: 14mm 17mm 10mm;
          }
          h1, h2, h3, p { margin: 0; }
          .top {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            align-items: start;
          }
          .brand {
            display: flex;
            gap: 8px;
            align-items: center;
          }
          .mark {
            width: 10mm;
            height: 10mm;
            display: grid;
            place-items: center;
            border-radius: 2mm;
            background: linear-gradient(135deg, #6d4aff, #2563eb 58%, #16c784);
            color: #fff;
            font-weight: 900;
          }
          .brand strong, .company strong { display: block; font-size: 11px; }
          .brand span, .company span, .label, .footer span { color: #6b778d; font-weight: 700; }
          .title { text-align: center; }
          .title h1 { font-size: 18px; letter-spacing: 0; }
          .title strong { display: block; color: #6d4aff; margin-top: 4px; font-size: 10px; }
          .company { text-align: right; }
          .intro {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 28mm;
            margin-top: 27mm;
            align-items: start;
          }
          .recipient strong { display: block; color: #6d4aff; margin: 3px 0 8px; font-size: 11px; }
          .facts { text-align: right; }
          .facts div {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-bottom: 2px;
          }
          .subject {
            margin-top: 7mm;
            font-weight: 800;
          }
          table {
            width: 100%;
            margin-top: 9mm;
            border-collapse: collapse;
          }
          th {
            background: linear-gradient(135deg, #7c3aed, #4f46e5);
            color: #fff;
            padding: 7px 8px;
            text-align: left;
            font-size: 8px;
          }
          td {
            border-bottom: 1px solid #e4eaf3;
            padding: 8px;
            vertical-align: top;
          }
          .right { text-align: right; }
          .strong { font-weight: 900; }
          .totals {
            width: 74mm;
            margin: 9mm 0 0 auto;
          }
          .totals div, .totals .grand {
            display: flex;
            justify-content: space-between;
            gap: 10px;
            padding: 4px 0;
          }
          .totals .grand {
            margin-top: 3px;
            background: #efeaff;
            color: #5f3df5;
            padding: 5px 8px;
            font-size: 15px;
            font-weight: 900;
          }
          .payment {
            display: grid;
            grid-template-columns: 1fr 30mm;
            gap: 10mm;
            align-items: end;
            margin-top: 9mm;
            padding-top: 7mm;
            border-top: 1px solid #d8e1ee;
          }
          .payment h3 {
            color: #d64a4a;
            font-size: 10px;
            margin-bottom: 3mm;
          }
          .payment p { margin-bottom: 2mm; }
          .qr { text-align: center; }
          .qr img { width: 27mm; height: 27mm; }
          .qr small { display: block; font-size: 7px; font-weight: 800; color: #6b778d; }
          .bottom {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20mm;
            margin-top: 7mm;
          }
          .bottom strong { display: block; margin-bottom: 2mm; }
          .thanks { margin-top: 6mm; text-align: center; font-weight: 800; }
          .footer {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 5mm;
            margin-top: auto;
            padding-top: 4mm;
            border-top: 1px solid #d8e1ee;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <main class="page">
          <header class="top">
            <section class="brand">
              <span class="mark">D</span>
              <div><strong>DreamInvoice</strong><span>Premium Edition</span></div>
            </section>
            <section class="title"><h1>RECHNUNG</h1><strong>${escapeHtml(data.number)}</strong></section>
            <section class="company">
              <span class="label">Rechnungssteller</span>
              <strong>${escapeHtml(creditor.name)}</strong>
            </section>
          </header>

          <section class="intro">
            <section class="recipient">
              <span class="label">Rechnung an</span>
              <strong>${escapeHtml(data.customer)}</strong>
              <p>${addressLines.map(escapeHtml).join("<br />")}</p>
            </section>
            <section class="facts">
              <div><span>Rechnungsdatum:</span><strong>${escapeHtml(formatDate(data.issueDate))}</strong></div>
              <div><span>Faelligkeitsdatum:</span><strong>${escapeHtml(formatDate(data.dueDate))}</strong></div>
              <div><span>Leistungszeitraum:</span><strong>${escapeHtml(data.servicePeriod)}</strong></div>
              <div><span>Rechnungsnummer:</span><strong>${escapeHtml(data.number)}</strong></div>
            </section>
          </section>

          <section class="subject">Betreff: ${escapeHtml(data.subject)}</section>

          <table>
            <thead>
              <tr>
                <th>Beschreibung</th>
                <th class="right">Menge</th>
                <th class="right">Preis (netto)</th>
                <th class="right">MwSt.</th>
                <th class="right">Gesamt (netto)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>

          <section class="totals">
            <div><span>Netto</span><strong>${euro(totals.net)}</strong></div>
            ${taxRows}
            <div class="grand"><span>Gesamt</span><strong>${euro(totals.gross)}</strong></div>
          </section>

          <section class="payment">
            <div>
              <h3>Zahlungsart: ${escapeHtml(data.paymentMethod)}</h3>
              <p>Bitte ueberweisen Sie den offenen Betrag unter Angabe des Verwendungszwecks ${escapeHtml(data.number)} auf unser unten angegebenes Konto.</p>
              <p><strong>Bankverbindung:</strong><br />${escapeHtml(creditor.name)}<br />IBAN: ${escapeHtml(creditor.iban)}<br />BIC: ${escapeHtml(creditor.bic)}</p>
              ${data.paymentInstructions ? `<p><strong>Zahlungshinweis:</strong><br />${formatMultilineHtml(data.paymentInstructions)}</p>` : ""}
              <p>Sie koennen auch den QR-GiroCode auf der rechten Seite nutzen, um die Zahlung einfach und unkompliziert ueber Ihre Online-Banking-App durchzufuehren.</p>
              <p><strong>Bitte beachten:</strong><br />Die Rechnung wird nach Zahlungseingang automatisch als bezahlt markiert.</p>
            </div>
            <div class="qr"><img src="${qrCodeUrl}" alt="GiroCode" /><small>GiroCode scannen</small></div>
          </section>

          <section class="bottom">
            <div><strong>Zahlungsbedingungen</strong><span>${escapeHtml(data.paymentTerms)}</span></div>
          </section>
          <p class="thanks">${escapeHtml(data.note)}</p>
          <footer class="footer">
            <span>TEL: 030 88 99300</span>
            <span>info@dreaminvoice.de</span>
            <span>www.dreaminvoice.de</span>
            <span>USt-IdNr.: DE123456789</span>
          </footer>
        </main>
      </body>
    </html>`
}

function applyInvoiceTemplateStyle(html: string, template: PreviewPdfPayload["template"]) {
  if (template === "minimal") {
    return html
      .replaceAll("linear-gradient(135deg, #7c3aed, #4f46e5)", "#111827")
      .replaceAll("#6d4aff", "#111827")
      .replaceAll("#5f3df5", "#111827")
      .replaceAll("#efeaff", "#f3f4f6")
  }

  if (template === "elegant") {
    return html
      .replace("<style>", "<style>body { font-family: Georgia, 'Times New Roman', serif !important; }")
      .replaceAll("linear-gradient(135deg, #7c3aed, #4f46e5)", "linear-gradient(135deg, #0f766e, #d4af37)")
      .replaceAll("#6d4aff", "#0f766e")
      .replaceAll("#5f3df5", "#0f766e")
      .replaceAll("#efeaff", "#ecfdf5")
  }

  if (template === "business") {
    return html
      .replace(".page {", ".page { border-top: 6mm solid #1e3a8a;")
      .replaceAll("linear-gradient(135deg, #7c3aed, #4f46e5)", "#1e3a8a")
      .replaceAll("#6d4aff", "#1e3a8a")
      .replaceAll("#5f3df5", "#1e3a8a")
      .replaceAll("#efeaff", "#eff6ff")
  }

  if (template === "premium") {
    return html
      .replace(".page {", ".page { border-top: 7mm solid #111827;")
      .replaceAll("linear-gradient(135deg, #7c3aed, #4f46e5)", "linear-gradient(135deg, #111827, #7c3aed)")
      .replaceAll("#6d4aff", "#7c3aed")
      .replaceAll("#5f3df5", "#111827")
      .replaceAll("#efeaff", "#111827")
      .replaceAll("color: #5f3df5;", "color: #fff;")
  }

  return html
}

function renderInvoiceHtml(data: PreviewPdfPayload, qrCodeUrl: string) {
  const baseHtml = data.template === "classic"
    ? renderClassicInvoiceHtml(data, qrCodeUrl)
    : renderModernInvoiceHtml(data, qrCodeUrl)

  return applyInvoiceTemplateStyle(baseHtml, data.template)
}

export async function POST(request: Request) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | undefined
  let browserUserDataDir: string | undefined

  try {
    const parsed = previewPdfSchema.safeParse(await request.json())
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Ungueltige PDF-Daten." }, { status: 400 })
    }

    const data = parsed.data
    const totals = totalsFor(data.items)
    const creditor = resolveCreditor(data)
    const qrCodeUrl = await qrCodeFor(data.number, totals.gross, creditor)
    const html = renderInvoiceHtml(data, qrCodeUrl)
    browserUserDataDir = await fs.mkdtemp(path.join(os.tmpdir(), "dream-invoice-preview-pdf-"))
    browser = await puppeteer.launch({
      headless: true,
      userDataDir: browserUserDataDir,
      env: {
        ...process.env,
        HOME: browserUserDataDir,
        XDG_CONFIG_HOME: browserUserDataDir,
        XDG_CACHE_HOME: browserUserDataDir
      },
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"]
    })
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "load" })
    const pdf = await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true })
    const filename = invoiceFileName(data.number)

    return new NextResponse(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "no-store"
      }
    })
  } catch (error) {
    console.error("Preview PDF generation failed.", error)
    return NextResponse.json({ ok: false, error: "PDF konnte nicht erstellt werden." }, { status: 500 })
  } finally {
    await browser?.close().catch(() => undefined)
    if (browserUserDataDir) {
      await fs.rm(browserUserDataDir, { recursive: true, force: true }).catch(() => undefined)
    }
  }
}
