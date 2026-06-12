"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import QRCode from "qrcode"
import {
  ArrowLeft,
  Download,
  Eye,
  GripVertical,
  Mail,
  MoreHorizontal,
  Plus,
  Save,
  Trash2
} from "lucide-react"
import styles from "./PremiumInvoiceEditor.module.css"

type TaxRate = {
  id: string
  label: string
  rate: number
}

type InvoiceItem = {
  id: string
  description: string
  quantity: number
  price: number
  taxRateId: string
}

type InvoiceState = {
  customer: string
  customerAddress: string
  customerEmail: string
  customerPhone: string
  number: string
  issueDate: string
  dueDate: string
  servicePeriod: string
  subject: string
  paymentTerms: string
  paymentMethod: string
  note: string
}

type TaxSummary = {
  label: string
  rate: number
  net: number
  tax: number
}

const initialTaxRates: TaxRate[] = [
  { id: "tax-19", label: "19% MwSt", rate: 19 },
  { id: "tax-7", label: "7% MwSt", rate: 7 },
  { id: "tax-0", label: "0% steuerfrei", rate: 0 }
]

const today = new Date().toISOString().slice(0, 10)
const due = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
const creditorName = "DreamInvoice GmbH"
const creditorIban = "DE97441523700000069757"
const creditorBic = "WELADED1LUN"

function euro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(value) ? value : 0
  )
}

function asNumber(value: string) {
  const parsed = Number.parseFloat(value.replace(",", "."))
  return Number.isFinite(parsed) ? parsed : 0
}

function itemNet(item: InvoiceItem) {
  return Math.max(item.quantity, 0) * Math.max(item.price, 0)
}

function lineId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.round(Math.random() * 10000)}`
}

function formatEpcAmount(value: number) {
  return `EUR${Math.max(value, 0).toFixed(2)}`
}

function buildEpcQrPayload(invoiceNumber: string, amount: number) {
  return [
    "BCD",
    "002",
    "1",
    "SCT",
    creditorBic,
    creditorName,
    creditorIban,
    formatEpcAmount(amount),
    "",
    "",
    invoiceNumber,
    `Rechnung ${invoiceNumber}`
  ].join("\n")
}

export function PremiumInvoiceEditor({ initialTheme = "light" }: { initialTheme?: "light" | "dark" }) {
  const [theme] = useState(initialTheme)
  const [invoice, setInvoice] = useState<InvoiceState>({
    customer: "Acme GmbH",
    customerAddress: "Musterstrasse 123\n12345 Musterstadt\nDeutschland",
    customerEmail: "info@acmegmbh.de",
    customerPhone: "+49 30 12345678",
    number: "RE-2026-0104",
    issueDate: today,
    dueDate: due,
    servicePeriod: "Mai 2026",
    subject: "Website Relaunch - Erstellung und Design",
    paymentTerms: "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
    paymentMethod: "Vorkasse (Ueberweisung)",
    note: "Vielen Dank fuer Ihren Auftrag. Bei Fragen kontaktieren Sie uns gerne."
  })
  const [taxRates, setTaxRates] = useState<TaxRate[]>(initialTaxRates)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "item-1", description: "Konzeption & Beratung", quantity: 10, price: 95, taxRateId: "tax-19" },
    { id: "item-2", description: "UI/UX Design", quantity: 20, price: 85, taxRateId: "tax-19" },
    { id: "item-3", description: "Frontend Entwicklung", quantity: 30, price: 95, taxRateId: "tax-19" },
    { id: "item-4", description: "Projektmanagement", quantity: 5, price: 90, taxRateId: "tax-19" }
  ])
  const [newTaxLabel, setNewTaxLabel] = useState("5% MwSt")
  const [newTaxRate, setNewTaxRate] = useState("5")
  const [status, setStatus] = useState("Bereit")
  const [draggedItemId, setDraggedItemId] = useState<string | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState("")

  const totals = useMemo(() => {
    const taxMap = new Map<string, TaxSummary>()
    let net = 0
    let tax = 0

    for (const item of items) {
      const rate = taxRates.find((entry) => entry.id === item.taxRateId) ?? taxRates[0]
      const lineNet = itemNet(item)
      const lineTax = lineNet * ((rate?.rate ?? 0) / 100)
      net += lineNet
      tax += lineTax

      const key = rate?.id ?? "tax-0"
      const current = taxMap.get(key) ?? { label: rate?.label ?? "0%", rate: rate?.rate ?? 0, net: 0, tax: 0 }
      current.net += lineNet
      current.tax += lineTax
      taxMap.set(key, current)
    }

    return {
      net,
      tax,
      gross: net + tax,
      taxes: Array.from(taxMap.values()).sort((a, b) => b.rate - a.rate)
    }
  }, [items, taxRates])

  const qrPayload = useMemo(() => buildEpcQrPayload(invoice.number, totals.gross), [invoice.number, totals.gross])

  useEffect(() => {
    let cancelled = false

    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 164,
      color: {
        dark: "#111827",
        light: "#ffffff"
      }
    }).then((url) => {
      if (!cancelled) setQrCodeUrl(url)
    }).catch(() => {
      if (!cancelled) setQrCodeUrl("")
    })

    return () => {
      cancelled = true
    }
  }, [qrPayload])

  function updateInvoice(field: keyof InvoiceState, value: string) {
    setInvoice((current) => ({ ...current, [field]: value }))
    setStatus("Entwurf geaendert")
  }

  function updateItem(id: string, patch: Partial<InvoiceItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))
    setStatus("Live neu berechnet")
  }

  function addItem() {
    setItems((current) => [
      ...current,
      {
        id: lineId("item"),
        description: "Neue Position",
        quantity: 1,
        price: 0,
        taxRateId: taxRates[0]?.id ?? "tax-19"
      }
    ])
    setStatus("Position hinzugefuegt")
  }

  function removeItem(id: string) {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current)
    setStatus("Position entfernt")
  }

  function moveItem(targetId: string) {
    if (!draggedItemId || draggedItemId === targetId) return

    setItems((current) => {
      const fromIndex = current.findIndex((item) => item.id === draggedItemId)
      const toIndex = current.findIndex((item) => item.id === targetId)
      if (fromIndex < 0 || toIndex < 0) return current

      const next = [...current]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
    setStatus("Positionen sortiert")
  }

  function addTaxRate() {
    const rate = asNumber(newTaxRate)
    const label = newTaxLabel.trim() || `${rate}% MwSt`
    const nextRate = { id: lineId("tax"), label, rate }
    setTaxRates((current) => [...current, nextRate])
    setNewTaxLabel("")
    setNewTaxRate("")
    setStatus(`${label} wurde angelegt`)
  }

  function saveDraft() {
    window.localStorage.setItem("dream-invoice-premium-draft", JSON.stringify({ invoice, items, taxRates }))
    setStatus("Entwurf lokal gespeichert")
  }

  function previewPdf() {
    setStatus("PDF-Vorschau im Druckdialog bereit")
    window.setTimeout(() => window.print(), 80)
  }

  function sendEmail() {
    setStatus(`E-Mail Versand fuer ${invoice.customer || "Kunde"} vorbereitet`)
  }

  return (
    <main className={styles.page} data-theme={theme}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>D</span>
          <div>
            <strong>DreamInvoice</strong>
            <small>Premium Edition</small>
          </div>
        </div>
        <nav>
          {[
            ["Dashboard", "/dashboard-v2"],
            ["Kunden", "/dashboard-v2/customers"],
            ["Projekte", "/dashboard-v2/projects"],
            ["Rechnungen", "/dashboard-v2/invoices"],
            ["Angebote", "/dashboard-v2/offers"],
            ["Zeiterfassung", "/dashboard-v2/time"],
            ["Ausgaben", "/dashboard-v2/expenses"],
            ["Artikel", "/dashboard-v2/articles"],
            ["Berichte", "/dashboard-v2/reports"]
          ].map(([label, href]) => <Link key={label} className={label === "Rechnungen" ? styles.activeNav : ""} href={href}>{label}</Link>)}
        </nav>
        <div className={styles.management}>
          <span>Management</span>
          <Link href="/dashboard-v2/users">Benutzer & Rollen</Link>
          <Link href="/dashboard-v2/license">Lizenzen</Link>
          <Link href="/dashboard-v2/settings">Einstellungen</Link>
          <Link href="/dashboard-v2/integrations">Integrationen</Link>
        </div>
        <div className={styles.planCard}>
          <strong>Premium Edition</strong>
          <span>Ihr aktueller Plan</span>
          <Link href="/dashboard-v2/license">Plan verwalten</Link>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.toolbar}>
          <div className={styles.titleRow}>
            <Link href="/dashboard-v2/invoices" aria-label="Zurueck"><ArrowLeft size={18} /></Link>
            <h1>Rechnung erstellen</h1>
            <span>Entwurf</span>
          </div>
          <div className={styles.topMeta}><Eye size={18} /><Mail size={18} /><span>D</span><strong>Daniel</strong></div>
        </header>
        <div className={styles.actionBar}>
          <div className={styles.toolbarActions}>
            <button type="button" onClick={saveDraft}><Save size={16} />Entwurf speichern</button>
            <button type="button" onClick={previewPdf}><Eye size={16} />PDF ansehen</button>
            <button type="button" onClick={previewPdf}><Download size={16} />PDF herunterladen</button>
            <button type="button" onClick={sendEmail}><Mail size={16} />Per E-Mail senden</button>
            <button type="button" aria-label="Mehr"><MoreHorizontal size={16} /></button>
          </div>
        </div>

        <section className={styles.editorGrid}>
          <div className={styles.formColumn}>
            <section className={styles.panel} id="kunde">
              <div className={styles.panelHead}>
                <h2>Kunde</h2>
                <button type="button"><Plus size={15} />Neuen Kunden anlegen</button>
              </div>
              <label>Kunde<input value={invoice.customer} onChange={(event) => updateInvoice("customer", event.target.value)} /></label>
              <div className={styles.customerGrid}>
                <p><strong>{invoice.customer}</strong><span>{invoice.customerAddress}</span></p>
                <p><strong>E-Mail</strong><span>{invoice.customerEmail}</span><strong>Telefon</strong><span>{invoice.customerPhone}</span></p>
              </div>
            </section>

            <section className={styles.panel} id="rechnungsdaten">
              <div className={styles.panelHead}>
                <h2>Rechnungsdaten</h2>
                <span>Nummer, Datum und Zahlungsziel</span>
              </div>
              <div className={styles.formGrid}>
                <label>Rechnungsnummer<input value={invoice.number} onChange={(event) => updateInvoice("number", event.target.value)} /></label>
                <label>Rechnungsdatum<input type="date" value={invoice.issueDate} onChange={(event) => updateInvoice("issueDate", event.target.value)} /></label>
                <label>Faelligkeitsdatum<input type="date" value={invoice.dueDate} onChange={(event) => updateInvoice("dueDate", event.target.value)} /></label>
              </div>
              <div className={styles.formGridTwo}>
                <label>Leistungszeitraum<input value={invoice.servicePeriod} onChange={(event) => updateInvoice("servicePeriod", event.target.value)} /></label>
                <label>Betreff<input value={invoice.subject} onChange={(event) => updateInvoice("subject", event.target.value)} /></label>
              </div>
            </section>

            <section className={styles.panel} id="positionen">
              <div className={styles.panelHead}>
                <h2>Positionen</h2>
                <button type="button" onClick={addItem}><Plus size={15} />Position</button>
              </div>
              <div className={styles.itemTable}>
                <div className={styles.itemHeader}>
                  <span /><span>Beschreibung</span><span>Menge</span><span>Preis (netto)</span><span>MwSt.</span><span>Gesamt (netto)</span><span />
                </div>
                {items.map((item) => {
                  const rate = taxRates.find((entry) => entry.id === item.taxRateId) ?? taxRates[0]
                  const net = itemNet(item)
                  return (
                    <div className={styles.itemRow} key={item.id} draggable onDragStart={() => setDraggedItemId(item.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => moveItem(item.id)} onDragEnd={() => setDraggedItemId(null)}>
                      <span className={styles.dragHandle} title="Position ziehen"><GripVertical size={16} /></span>
                      <input value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} />
                      <div className={styles.quantityCell}><input value={String(item.quantity)} inputMode="decimal" onChange={(event) => updateItem(item.id, { quantity: asNumber(event.target.value) })} /><span>Std.</span></div>
                      <input value={String(item.price)} inputMode="decimal" onChange={(event) => updateItem(item.id, { price: asNumber(event.target.value) })} />
                      <select value={item.taxRateId} onChange={(event) => updateItem(item.id, { taxRateId: event.target.value })}>
                        {taxRates.map((taxRate) => <option key={taxRate.id} value={taxRate.id}>{taxRate.label}</option>)}
                      </select>
                      <strong>{euro(net)}</strong>
                      <button type="button" aria-label="Position entfernen" onClick={() => removeItem(item.id)}><Trash2 size={15} /></button>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className={styles.panel} id="steuern">
              <div className={styles.panelHead}>
                <h2>MwSt Saetze</h2>
                <span>19%, 7%, 0% oder eigener Satz</span>
              </div>
              <div className={styles.taxGrid}>
                {taxRates.map((taxRate) => <span key={taxRate.id}>{taxRate.label}</span>)}
              </div>
              <div className={styles.taxCreator}>
                <input aria-label="Name des Steuersatzes" placeholder="Name" value={newTaxLabel} onChange={(event) => setNewTaxLabel(event.target.value)} />
                <input aria-label="Prozent" placeholder="%" inputMode="decimal" value={newTaxRate} onChange={(event) => setNewTaxRate(event.target.value)} />
                <button type="button" onClick={addTaxRate}><Plus size={15} />MwSt anlegen</button>
              </div>
            </section>
            <section className={styles.panel} id="zahlung">
              <div className={styles.panelHead}>
                <h2>Zahlungsbedingungen</h2>
                <span>{status}</span>
              </div>
              <div className={styles.formGridThree}>
                <label>Zahlungsziel (Tage)<input value="14 Tage" readOnly /></label>
                <label>Zahlungsbedingungen<input value={invoice.paymentTerms} onChange={(event) => updateInvoice("paymentTerms", event.target.value)} /></label>
                <label>Zahlungsart<input value={invoice.paymentMethod} onChange={(event) => updateInvoice("paymentMethod", event.target.value)} /></label>
              </div>
              <label>Notizen / Anmerkungen<textarea rows={3} value={invoice.note} onChange={(event) => updateInvoice("note", event.target.value)} /></label>
            </section>
          </div>

          <aside className={styles.previewColumn} id="vorschau">
            <article className={styles.invoicePreview}>
              <header>
                <div className={styles.documentTitle}>
                  <h2>RECHNUNG</h2>
                </div>
              </header>
              <div className={styles.previewMeta}>
                <div>
                  <span>Rechnung an</span>
                  <strong>{invoice.customer || "Kunde"}</strong>
                  <p>{invoice.customerAddress}</p>
                </div>
                <div className={styles.companyBlock}>
                  <strong>DreamInvoice GmbH</strong>
                  <span>Sonnenstrasse 25<br />80331 Muenchen<br />Deutschland</span>
                </div>
              </div>
              <div className={styles.invoiceInfoRow}>
                <div className={styles.subjectBlock}>
                  <span>Betreff</span>
                  <strong>{invoice.subject}</strong>
                </div>
                <div className={styles.invoiceFacts}>
                  <p><span>Rechnungsdatum:</span><strong>{invoice.issueDate}</strong></p>
                  <p><span>Faelligkeitsdatum:</span><strong>{invoice.dueDate}</strong></p>
                  <p><span>Leistungszeitraum:</span><strong>{invoice.servicePeriod}</strong></p>
                  <p><span>Rechnungsnummer:</span><strong>{invoice.number}</strong></p>
                </div>
              </div>
              <div className={styles.previewItems}>
                <div className={styles.previewItemsHead}><span>Beschreibung</span><span>Menge</span><span>Preis (netto)</span><span>MwSt.</span><span>Gesamt (netto)</span></div>
                {items.map((item) => {
                  const rate = taxRates.find((entry) => entry.id === item.taxRateId) ?? taxRates[0]
                  return (
                    <div key={item.id}>
                      <span>{item.description}</span>
                      <span>{item.quantity} Std.</span>
                      <span>{euro(item.price)}</span>
                      <span>{rate?.rate}%</span>
                      <b>{euro(itemNet(item))}</b>
                    </div>
                  )
                })}
              </div>
              <div className={styles.previewTotals}>
                <p><span>Netto</span><b>{euro(totals.net)}</b></p>
                {totals.taxes.map((entry) => <p key={entry.label}><span>{entry.label} auf {euro(entry.net)}</span><b>{euro(entry.tax)}</b></p>)}
                <strong><span>Gesamt</span><b>{euro(totals.gross)}</b></strong>
              </div>
              <section className={styles.paymentBlock}>
                <div>
                  <h3>Zahlungsart: {invoice.paymentMethod}</h3>
                  <p>Bitte ueberweisen Sie den offenen Betrag unter Angabe des Verwendungszwecks {invoice.number} auf unser unten angegebenes Konto.</p>
                  <p>Sie koennen auch den QR-GiroCode auf der rechten Seite nutzen, um die Zahlung einfach und unkompliziert ueber Ihre Online-Banking-App durchzufuehren.</p>
                  <p><strong>Bitte beachten:</strong><br />Die Rechnung wird nach Zahlungseingang automatisch als bezahlt markiert.</p>
                </div>
                <div className={styles.qrBox}>
                  {qrCodeUrl ? <img src={qrCodeUrl} alt={`GiroCode fuer ${invoice.number}`} /> : <span>QR</span>}
                  <small>GiroCode scannen</small>
                </div>
              </section>
              <footer>
                <div><strong>Zahlungsbedingungen</strong><span>{invoice.paymentTerms}</span></div>
                <div><strong>Bankverbindung</strong><span>IBAN: {creditorIban}<br />BIC: {creditorBic}</span></div>
              </footer>
              <p className={styles.thanks}>{invoice.note}</p>
              <div className={styles.documentFooter}>
                <span>TEL: 030 88 99300</span>
                <span>info@dreaminvoice.de</span>
                <span>www.dreaminvoice.de</span>
                <span>USt-IdNr.: DE123456789</span>
              </div>
            </article>
          </aside>
        </section>
      </section>
    </main>
  )
}
