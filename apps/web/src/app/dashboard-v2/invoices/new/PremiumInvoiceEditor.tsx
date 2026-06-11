"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Download,
  Eye,
  FileText,
  Mail,
  Plus,
  Printer,
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
  number: string
  issueDate: string
  dueDate: string
  paymentTerms: string
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

export function PremiumInvoiceEditor({ initialTheme = "light" }: { initialTheme?: "light" | "dark" }) {
  const [theme] = useState(initialTheme)
  const [invoice, setInvoice] = useState<InvoiceState>({
    customer: "Acme GmbH",
    customerAddress: "Lindenallee 12\n10115 Berlin\nDeutschland",
    number: "RE-2026-0104",
    issueDate: today,
    dueDate: due,
    paymentTerms: "Zahlbar innerhalb von 14 Tagen ohne Abzug.",
    note: "Vielen Dank fuer die angenehme Zusammenarbeit."
  })
  const [taxRates, setTaxRates] = useState<TaxRate[]>(initialTaxRates)
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: "item-1", description: "Premium Beratung", quantity: 2, price: 149, taxRateId: "tax-19" },
    { id: "item-2", description: "Wartungspaket", quantity: 1, price: 89, taxRateId: "tax-7" },
    { id: "item-3", description: "Reverse-Charge Leistung", quantity: 1, price: 240, taxRateId: "tax-0" }
  ])
  const [newTaxLabel, setNewTaxLabel] = useState("5% MwSt")
  const [newTaxRate, setNewTaxRate] = useState("5")
  const [status, setStatus] = useState("Bereit")

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
        <Link className={styles.backLink} href="/dashboard-v2/invoices"><ArrowLeft size={16} /> Zurueck</Link>
        <div className={styles.brand}>
          <span>D</span>
          <div>
            <strong>DreamInvoice</strong>
            <small>Premium Editor</small>
          </div>
        </div>
        <nav>
          {["Kunde", "Rechnungsdaten", "Positionen", "Steuern", "Vorschau"].map((item) => <a key={item} href={`#${item.toLowerCase()}`}>{item}</a>)}
        </nav>
        <div className={styles.sidebarTotal}>
          <span>Rechnungsbetrag</span>
          <strong>{euro(totals.gross)}</strong>
          <small>{status}</small>
        </div>
      </aside>

      <section className={styles.workspace}>
        <header className={styles.toolbar}>
          <div>
            <span>Rechnungen</span>
            <h1>Rechnung erstellen</h1>
          </div>
          <div className={styles.toolbarActions}>
            <button type="button" onClick={saveDraft}><Save size={16} />Entwurf speichern</button>
            <button type="button" onClick={previewPdf}><Eye size={16} />PDF ansehen</button>
            <button type="button" onClick={previewPdf}><Download size={16} />PDF herunterladen</button>
            <button type="button" onClick={sendEmail}><Mail size={16} />Per E-Mail senden</button>
          </div>
        </header>

        <section className={styles.editorGrid}>
          <div className={styles.formColumn}>
            <section className={styles.panel} id="kunde">
              <div className={styles.panelHead}>
                <h2>Kunde</h2>
                <span>Empfaenger und Adresse</span>
              </div>
              <label>Kunde<input value={invoice.customer} onChange={(event) => updateInvoice("customer", event.target.value)} /></label>
              <label>Adresse<textarea rows={4} value={invoice.customerAddress} onChange={(event) => updateInvoice("customerAddress", event.target.value)} /></label>
            </section>

            <section className={styles.panel} id="rechnungsdaten">
              <div className={styles.panelHead}>
                <h2>Rechnungsdaten</h2>
                <span>Nummer, Datum und Zahlungsziel</span>
              </div>
              <div className={styles.formGrid}>
                <label>Rechnungsnummer<input value={invoice.number} onChange={(event) => updateInvoice("number", event.target.value)} /></label>
                <label>Rechnungsdatum<input type="date" value={invoice.issueDate} onChange={(event) => updateInvoice("issueDate", event.target.value)} /></label>
                <label>Faelligkeit<input type="date" value={invoice.dueDate} onChange={(event) => updateInvoice("dueDate", event.target.value)} /></label>
              </div>
              <label>Zahlungsbedingungen<textarea rows={2} value={invoice.paymentTerms} onChange={(event) => updateInvoice("paymentTerms", event.target.value)} /></label>
            </section>

            <section className={styles.panel} id="positionen">
              <div className={styles.panelHead}>
                <h2>Positionen</h2>
                <button type="button" onClick={addItem}><Plus size={15} />Position</button>
              </div>
              <div className={styles.itemTable}>
                <div className={styles.itemHeader}>
                  <span>Beschreibung</span><span>Menge</span><span>Preis</span><span>MwSt</span><span>Gesamt</span><span />
                </div>
                {items.map((item) => {
                  const rate = taxRates.find((entry) => entry.id === item.taxRateId) ?? taxRates[0]
                  const net = itemNet(item)
                  const gross = net + net * ((rate?.rate ?? 0) / 100)
                  return (
                    <div className={styles.itemRow} key={item.id}>
                      <input value={item.description} onChange={(event) => updateItem(item.id, { description: event.target.value })} />
                      <input value={String(item.quantity)} inputMode="decimal" onChange={(event) => updateItem(item.id, { quantity: asNumber(event.target.value) })} />
                      <input value={String(item.price)} inputMode="decimal" onChange={(event) => updateItem(item.id, { price: asNumber(event.target.value) })} />
                      <select value={item.taxRateId} onChange={(event) => updateItem(item.id, { taxRateId: event.target.value })}>
                        {taxRates.map((taxRate) => <option key={taxRate.id} value={taxRate.id}>{taxRate.label}</option>)}
                      </select>
                      <strong>{euro(gross)}</strong>
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
              <label>Notiz<textarea rows={3} value={invoice.note} onChange={(event) => updateInvoice("note", event.target.value)} /></label>
            </section>
          </div>

          <aside className={styles.previewColumn} id="vorschau">
            <div className={styles.previewToolbar}>
              <span>Live Vorschau</span>
              <button type="button" onClick={previewPdf}><Printer size={15} />Drucken</button>
            </div>
            <article className={styles.invoicePreview}>
              <header>
                <div className={styles.previewLogo}>D</div>
                <div>
                  <strong>DreamInvoice</strong>
                  <span>Premium Edition</span>
                </div>
              </header>
              <div className={styles.previewMeta}>
                <div>
                  <span>Rechnung an</span>
                  <strong>{invoice.customer || "Kunde"}</strong>
                  <p>{invoice.customerAddress}</p>
                </div>
                <div>
                  <span>Rechnung</span>
                  <strong>{invoice.number}</strong>
                  <p>{invoice.issueDate}<br />Faellig {invoice.dueDate}</p>
                </div>
              </div>
              <div className={styles.previewItems}>
                {items.map((item) => {
                  const rate = taxRates.find((entry) => entry.id === item.taxRateId) ?? taxRates[0]
                  return (
                    <div key={item.id}>
                      <span>{item.description}</span>
                      <small>{item.quantity} x {euro(item.price)} · {rate?.label}</small>
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
              <footer>
                <FileText size={16} />
                <span>{invoice.paymentTerms}</span>
              </footer>
            </article>
          </aside>
        </section>
      </section>
    </main>
  )
}
