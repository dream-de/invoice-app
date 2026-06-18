import type { DocumentElement, DocumentTemplate } from "@/lib/document-templates/types"

type PdfCustomer = {
  name?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
  country?: string | null
}

type PdfCompany = {
  company: string
  street: string | null
  zip: string | null
  city: string | null
  country: string | null
  iban?: string | null
  bic?: string | null
  bankName?: string | null
}

type PdfLayoutProps = {
  title: string
  number: string
  date: string
  dueDate?: string | null
  customer: PdfCustomer | null
  company: PdfCompany
  positions: {
    title: string
    quantity: number
    unitPrice: number
  }[]
  subTotal: number
  vatAmount: number
  total: number
  template?: DocumentTemplate | null
  paymentQrDataUrl?: string | null
  paymentNote?: string | null
  paymentInstructions?: string | null
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;")
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR"
  }).format(value)
}

function replacePlaceholders(content: string | undefined, props: PdfLayoutProps) {
  return String(content ?? "")
    .replaceAll("{{number}}", props.number)
    .replaceAll("{{date}}", props.date)
    .replaceAll("{{customerName}}", props.customer?.name ?? "")
    .replaceAll(
      "{{customerAddress}}",
      [
        props.customer?.name,
        props.customer?.street,
        [props.customer?.zip, props.customer?.city].filter(Boolean).join(" "),
        props.customer?.country
      ]
        .filter(Boolean)
        .join("\n")
    )
    .replaceAll("{{net}}", formatCurrency(props.subTotal))
    .replaceAll("{{vat}}", formatCurrency(props.vatAmount))
    .replaceAll("{{gross}}", formatCurrency(props.total))
    .replaceAll("{{invoice.number}}", props.number)
    .replaceAll("{{invoice.date}}", props.date)
    .replaceAll("{{invoice.dueDate}}", props.dueDate ?? props.date)
    .replaceAll("{{invoice.servicePeriod}}", props.date)
    .replaceAll("{{invoice.serviceDate}}", props.date)
    .replaceAll("{{invoice.paymentTerms}}", props.paymentInstructions ?? "")
    .replaceAll("{{payment.instructions}}", props.paymentInstructions ?? "")
    .replaceAll("{{payment.note}}", props.paymentNote ?? "")
    .replaceAll("{{client.name}}", props.customer?.name ?? "")
    .replaceAll("{{client.address}}", [props.customer?.name, props.customer?.street, [props.customer?.zip, props.customer?.city].filter(Boolean).join(" "), props.customer?.country].filter(Boolean).join("\n"))
    .replaceAll("{{client.email}}", "")
    .replaceAll("{{client.number}}", "DI-DI-KD-1001")
    .replaceAll("{{company.name}}", props.company.company)
    .replaceAll("{{company.street}}", props.company.street ?? "")
    .replaceAll("{{company.city}}", [props.company.zip, props.company.city].filter(Boolean).join(" "))
    .replaceAll("{{company.vatId}}", "")
    .replaceAll("{{finance.iban}}", props.company.iban ?? "")
    .replaceAll("{{finance.bic}}", props.company.bic ?? "")
    .replaceAll("{{finance.taxNumber}}", "")
    .replaceAll("{{totals.net}}", formatCurrency(props.subTotal))
    .replaceAll("{{totals.vat}}", formatCurrency(props.vatAmount))
    .replaceAll("{{totals.gross}}", formatCurrency(props.total))
}

function elementStyle(element: DocumentElement) {
  return [
    "position:absolute",
    `left:${element.x}px`,
    `top:${element.y}px`,
    `width:${element.width}px`,
    `height:${element.height}px`,
    `color:${element.color ?? "#111111"}`,
    `background:${element.backgroundColor ?? "transparent"}`,
    `font-size:${element.fontSize ?? 12}px`,
    `font-weight:${element.fontWeight === "black" ? 900 : element.fontWeight === "bold" ? 700 : 400}`,
    `text-align:${element.align ?? "left"}`,
    "white-space:pre-line",
    "box-sizing:border-box"
  ].join(";")
}

function getTableHeaders(element: DocumentElement) {
  const variant = String(element.content ?? "").trim().toLowerCase()
  const headersByVariant: Record<string, [string, string, string, string]> = {
    default: ["Position", "Menge", "Einzel", "Gesamt"],
    service: ["Leistung", "Menge", "Einzel", "Betrag"],
    vehicle: ["Leistung / Teil", "Anzahl", "Einzel", "Betrag"],
    workshop: ["Arbeit / Teil", "Menge", "Einzel", "Betrag"],
    it: ["Service / Zeitraum", "Menge", "Einzel", "Betrag"],
    gastronomy: ["Speisen / Service", "Menge", "Einzel", "Betrag"],
    retail: ["Artikel", "Menge", "Einzel", "Summe"],
    wholesale: ["Warenposition", "Menge", "Einzel", "Summe"],
    beverage: ["Getraenke / Pfand", "Menge", "Einzel", "Summe"],
    offer: ["Leistung / Umfang", "Menge", "Einzel", "Angebot"]
  }

  return headersByVariant[variant] ?? headersByVariant.default
}

function renderTemplateElement(element: DocumentElement, props: PdfLayoutProps) {
  if (element.type === "paymentQr") {
    if (!props.paymentQrDataUrl) return ""
    return `
      <div style="${elementStyle(element)}">
        <img src="${props.paymentQrDataUrl}" alt="SEPA QR-Code" style="width:100%;height:100%;object-fit:contain;" />
      </div>
    `
  }

  if (element.type === "line") {
    return `<div style="${elementStyle(element)};height:${Math.max(1, element.height)}px;background:${element.color ?? "#111111"}"></div>`
  }

  if (element.type === "logo") {
    return `<div style="${elementStyle(element)};border:1px solid #e5e7eb;border-radius:6px;"></div>`
  }

  if (element.type === "box") {
    return `<div style="${elementStyle(element)};border:${element.borderWidth ?? 1}px solid ${element.borderColor ?? "#e5e7eb"};"></div>`
  }

  if (element.type === "table") {
    const [descriptionHeader, quantityHeader, unitHeader, totalHeader] = getTableHeaders(element)
    const rows = props.positions
      .map(
        (item) => `
          <tr>
            <td>${escapeHtml(item.title)}</td>
            <td class="right">${escapeHtml(item.quantity)}</td>
            <td class="right">${formatCurrency(item.unitPrice)}</td>
            <td class="right">${formatCurrency(item.quantity * item.unitPrice)}</td>
          </tr>
        `
      )
      .join("")

    return `
      <div style="${elementStyle(element)}">
        <table>
          <thead>
            <tr>
              <th>${escapeHtml(descriptionHeader)}</th>
              <th class="right">${escapeHtml(quantityHeader)}</th>
              <th class="right">${escapeHtml(unitHeader)}</th>
              <th class="right">${escapeHtml(totalHeader)}</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `
  }

  return `
    <div style="${elementStyle(element)}">
      ${escapeHtml(replacePlaceholders(element.content, props))}
    </div>
  `
}

function renderTemplate(props: PdfLayoutProps) {
  const template = props.template
  if (!template?.elements?.length) return null

  return `
    <main class="template-page" style="width:${template.page.width}px;height:${template.page.height}px;">
      ${template.elements.map((element) => renderTemplateElement(element, props)).join("")}
    </main>
  `
}

function renderFallback(props: PdfLayoutProps) {
  const paymentBlock = props.paymentQrDataUrl
    ? `
      <section class="payment">
        <div>
          <p class="eyebrow">Direkt bezahlen</p>
          <h2>SEPA QR-Code</h2>
          <p class="muted">Mit der Banking-App scannen. Empfänger, IBAN, Betrag und Verwendungszweck werden vorausgefüllt.</p>
          ${props.paymentInstructions ? `<p class="muted"><strong>Zahlungshinweis:</strong><br />${escapeHtml(props.paymentInstructions)}</p>` : ""}
          ${props.paymentNote ? `<p class="muted"><strong>Verwendungszweck:</strong><br />${escapeHtml(props.paymentNote)}</p>` : ""}
        </div>
        <img class="qr" src="${props.paymentQrDataUrl}" alt="SEPA QR-Code" />
      </section>
    `
    : ""

  return `
    <main class="fallback-page">
      <section class="top">
        <div>
          <p class="brand">${escapeHtml(props.company.company)}</p>
          <p class="muted">${escapeHtml(props.company.street)}</p>
          <p class="muted">${escapeHtml(props.company.zip)} ${escapeHtml(props.company.city)}</p>
          <p class="muted">${escapeHtml(props.company.country)}</p>
        </div>
        <div class="meta">
          <p><strong>Rechnung Nr.</strong> ${escapeHtml(props.number)}</p>
          <p><strong>Datum</strong> ${escapeHtml(props.date)}</p>
        </div>
      </section>

      <section class="title">
        <div>
          <p class="eyebrow">${escapeHtml(props.title)}</p>
          <h1>Rechnung ${escapeHtml(props.number)}</h1>
        </div>
        <div class="right">
          <p class="eyebrow">Gesamtbetrag</p>
          <h1>${formatCurrency(props.total)}</h1>
        </div>
      </section>

      <section class="address">
        <div>
          <p class="eyebrow">Empfänger</p>
          <p><strong>${escapeHtml(props.customer?.name)}</strong></p>
          <p>${escapeHtml(props.customer?.street)}</p>
          <p>${escapeHtml(props.customer?.zip)} ${escapeHtml(props.customer?.city)}</p>
          <p>${escapeHtml(props.customer?.country)}</p>
        </div>
      </section>

      ${renderTemplateElement({ id: "items", type: "table", x: 0, y: 0, width: 690, height: 260 }, props)}

      <section class="totals">
        <div class="total-row"><span>Netto</span><strong>${formatCurrency(props.subTotal)}</strong></div>
        <div class="total-row"><span>MwSt</span><strong>${formatCurrency(props.vatAmount)}</strong></div>
        <div class="total-row grand"><span>Brutto</span><span>${formatCurrency(props.total)}</span></div>
      </section>

      ${paymentBlock}
    </main>
  `
}

export function pdfLayout(props: PdfLayoutProps) {
  const body = renderTemplate(props) ?? renderFallback(props)

  return `
    <!doctype html>
    <html lang="de">
      <head>
        <meta charset="utf-8" />
        <style>
          @page { size: A4; margin: 0; }
          * { box-sizing: border-box; }
          body {
            margin: 0;
            color: #111827;
            font-family: Arial, Helvetica, sans-serif;
            font-size: 12px;
            line-height: 1.45;
            background: #ffffff;
          }
          h1, h2, h3, p { margin: 0; }
          .template-page {
            position: relative;
            background: #ffffff;
            overflow: hidden;
          }
          .fallback-page {
            min-height: 1123px;
            padding: 72px;
            display: flex;
            flex-direction: column;
          }
          .top, .title, .address {
            display: flex;
            justify-content: space-between;
            gap: 32px;
          }
          .top {
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 22px;
          }
          .title { margin-top: 42px; }
          .address { margin-top: 32px; }
          .brand { font-size: 20px; font-weight: 800; }
          .meta, .right { text-align: right; }
          .eyebrow {
            color: #6b7280;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.12em;
            margin-bottom: 8px;
            text-transform: uppercase;
          }
          .muted { color: #6b7280; }
          table {
            width: 100%;
            border-collapse: collapse;
          }
          th {
            background: #f3f4f6;
            color: #6b7280;
            font-size: 10px;
            letter-spacing: 0.08em;
            padding: 8px 10px;
            text-align: left;
            text-transform: uppercase;
          }
          td {
            border-bottom: 1px solid #eef2f7;
            padding: 9px 10px;
          }
          .right { text-align: right; }
          .totals {
            margin-top: 28px;
            margin-left: auto;
            width: 260px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 7px 0;
          }
          .grand {
            border-top: 2px solid #111827;
            font-size: 16px;
            font-weight: 800;
            margin-top: 8px;
            padding-top: 12px;
          }
          .payment {
            margin-top: auto;
            display: grid;
            grid-template-columns: 1fr 128px;
            gap: 24px;
            align-items: center;
            border: 1px solid #e5e7eb;
            border-radius: 14px;
            padding: 16px;
          }
          .qr {
            width: 128px;
            height: 128px;
          }
        </style>
      </head>
      <body>${body}</body>
    </html>
  `
}
