"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, Building2, CheckCircle2, FileClock, Landmark, Link2, LockKeyhole, Plug, ReceiptText, RefreshCw, SearchCheck, ShieldCheck } from "lucide-react"
import { PageShell } from "@dream-invoice/ui"

type Connection = {
  id: string
  provider: string
  bankName: string
  status: string
  lastSyncedAt: string | null
  connectedAt: string | null
  createdAt: string
}

type Account = {
  id: string
  connectionId: string | null
  accountName: string
  bankName: string | null
  iban: string | null
  currency: string
  balance: number | null
  status: string
  isDefault: boolean
  lastSyncedAt: string | null
}

type StatusState = {
  provider: string
  configured: boolean
  credentialsPrepared: boolean
  callbackUrl: string
  mode: string
}

type OpenInvoice = {
  id: string
  number: string
  customer: string
  amount: number
  status: string
}

type ReconciliationTransaction = {
  id: string
  date: string
  amount: number
  currency: string
  purpose: string
  counterparty: string
  matchStatus: string
  matchedInvoiceId: string | null
  paymentStatusAction: string
  suggestedInvoice: { id: string; number: string; customer: string; amount: number } | null
  confidence: number
  reasons: string[]
  matchedAt: string | null
  matchedBy: string | null
  invoicePaidByBankMatch: { label: string; date: string | null; bankTransactionId: string } | null
}

function formatDate(value: string | null) {
  if (!value) return "Noch nie"
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
}

function formatCurrency(value: number | null, currency: string) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency }).format(value ?? 0)
}

export function OpenBankingClient() {
  const [status, setStatus] = useState<StatusState | null>(null)
  const [connections, setConnections] = useState<Connection[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [message, setMessage] = useState("")
  const [reconciliation, setReconciliation] = useState<ReconciliationTransaction[]>([])
  const [openInvoices, setOpenInvoices] = useState<OpenInvoice[]>([])
  const [manualMatches, setManualMatches] = useState<Record<string, string>>({})
  const [isBusy, setIsBusy] = useState(false)

  const defaultAccount = useMemo(() => accounts.find((account) => account.isDefault), [accounts])

  async function load() {
    const [statusResponse, connectionsResponse, reconciliationResponse] = await Promise.all([
      fetch("/api/finance/open-banking/status", { cache: "no-store" }),
      fetch("/api/finance/open-banking/connections", { cache: "no-store" }),
      fetch("/api/finance/open-banking/reconciliation", { cache: "no-store" })
    ])
    const statusResult = await statusResponse.json().catch(() => ({}))
    const connectionsResult = await connectionsResponse.json().catch(() => ({}))
    const reconciliationResult = await reconciliationResponse.json().catch(() => ({}))

    if (statusResponse.ok && statusResult.ok) setStatus(statusResult)
    if (connectionsResponse.ok && connectionsResult.ok) {
      setConnections(Array.isArray(connectionsResult.connections) ? connectionsResult.connections : [])
      setAccounts(Array.isArray(connectionsResult.accounts) ? connectionsResult.accounts : [])
    }
    if (reconciliationResponse.ok && reconciliationResult.ok) {
      setReconciliation(Array.isArray(reconciliationResult.transactions) ? reconciliationResult.transactions : [])
      setOpenInvoices(Array.isArray(reconciliationResult.openInvoices) ? reconciliationResult.openInvoices : [])
    }
  }

  useEffect(() => {
    load().catch(() => setMessage("Open-Banking-Status konnte nicht geladen werden."))
  }, [])

  async function connectBank() {
    setIsBusy(true)
    setMessage("finAPI Status wird geprueft...")
    try {
      const statusResponse = await fetch("/api/finance/open-banking/status", { cache: "no-store" })
      const statusResult = await statusResponse.json().catch(() => ({}))
      if (!statusResponse.ok || !statusResult.ok) {
        setMessage(statusResult.error || "finAPI Status konnte nicht geprueft werden.")
        return
      }
      setStatus(statusResult)
      setMessage("Verbindung wird vorbereitet...")

      const response = await fetch("/api/finance/open-banking/connections", { method: "POST" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) {
        setMessage(result.error || "Bankverbindung konnte nicht vorbereitet werden.")
        return
      }

      setConnections(Array.isArray(result.connections) ? result.connections : [])
      setAccounts(Array.isArray(result.accounts) ? result.accounts : [])
      await load()
      setMessage("Bankverbindung gespeichert. Callback ist vorbereitet; keine Bank-Zugangsdaten wurden gespeichert.")
    } catch {
      setMessage("Bankverbindung konnte nicht vorbereitet werden.")
    } finally {
      setIsBusy(false)
    }
  }

  async function prepareManualMatch(transactionId: string) {
    const invoiceId = manualMatches[transactionId]
    if (!invoiceId) {
      setMessage("Bitte zuerst eine offene Rechnung auswaehlen.")
      return
    }

    setIsBusy(true)
    try {
      const response = await fetch("/api/finance/open-banking/reconciliation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transactionId, invoiceId })
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result.ok) {
        setMessage(result.error || "Zuordnung konnte nicht bestaetigt werden.")
        return
      }
      setReconciliation(Array.isArray(result.transactions) ? result.transactions : [])
      setOpenInvoices(Array.isArray(result.openInvoices) ? result.openInvoices : [])
      setMessage(result.message || "Zuordnung bestaetigt.")
    } catch {
      setMessage("Zuordnung konnte nicht vorbereitet werden.")
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <PageShell title="Open Banking" description="Bankverbindung ueber finAPI vorbereiten und verbinden.">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/finance" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            Zurueck
          </Link>
          <button type="button" onClick={connectBank} disabled={isBusy} className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] disabled:cursor-not-allowed disabled:opacity-60">
            <Link2 className="h-4 w-4" />
            Bank verbinden
          </button>
        </div>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <div className="flex items-start gap-3">
            <LockKeyhole className="mt-0.5 h-5 w-5" />
            <div>
              <h2 className="font-extrabold">finAPI-Verbindungsflow vorbereitet</h2>
              <p className="mt-1 text-sm font-semibold leading-6">Nur Admins koennen den Flow starten. Es werden keine Bank-Zugangsdaten gespeichert und keine Tokens im Frontend angezeigt.</p>
            </div>
          </div>
        </section>

        {message ? <p className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">{message}</p> : null}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {[
            { title: "finAPI Status", value: status?.mode || "Pruefbar", icon: Plug },
            { title: "Callback", value: status?.callbackUrl ? "Vorbereitet" : "Offen", icon: RefreshCw },
            { title: "Verbindungen", value: String(connections.length), icon: Building2 },
            { title: "Standardkonto", value: defaultAccount?.accountName || "Nicht gesetzt", icon: Landmark }
          ].map((item) => {
            const Icon = item.icon
            return (
              <section key={item.title} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]"><Icon className="h-4 w-4" /></span>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-slate-400">{item.title}</p>
                <strong className="mt-1 block text-lg font-extrabold text-slate-950">{item.value}</strong>
              </section>
            )
          })}
        </div>

        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">BankConnections</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Gespeicherte finAPI-Verbindungen ohne Frontend-Tokens.</p>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-[1.2fr_0.7fr_0.7fr_1fr_1fr] gap-3 bg-gray-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 max-lg:hidden">
              <span>Bankname</span><span>Provider</span><span>Status</span><span>Letzte Sync</span><span>Verbunden am</span>
            </div>
            {connections.length ? connections.map((connection) => (
              <div key={connection.id} className="grid grid-cols-[1.2fr_0.7fr_0.7fr_1fr_1fr] gap-3 border-t border-gray-100 px-4 py-3 text-sm font-semibold text-slate-700 max-lg:grid-cols-1">
                <span className="font-extrabold text-slate-950">{connection.bankName}</span>
                <span>finAPI</span>
                <span>{connection.status}</span>
                <span>{formatDate(connection.lastSyncedAt)}</span>
                <span>{formatDate(connection.connectedAt || connection.createdAt)}</span>
              </div>
            )) : <div className="border-t border-gray-100 px-4 py-8 text-center text-sm font-semibold text-slate-500">Noch keine Bankverbindung gespeichert.</div>}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <h2 className="text-xl font-extrabold text-slate-950">BankAccounts</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {accounts.length ? accounts.map((account) => (
              <article key={account.id} className="rounded-3xl border border-gray-200 bg-gray-50 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-950">{account.accountName}</h3>
                    <p className="mt-1 text-sm font-semibold text-slate-500">{account.bankName || "finAPI"} · {account.iban || "IBAN maskiert"}</p>
                  </div>
                  {account.isDefault ? <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">Standardkonto</span> : null}
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Waehrung</p><strong className="text-sm text-slate-950">{account.currency}</strong></div>
                  <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Kontostand</p><strong className="text-sm text-slate-950">{formatCurrency(account.balance, account.currency)}</strong></div>
                  <div><p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p><strong className="text-sm text-slate-950">{account.status}</strong></div>
                </div>
              </article>
            )) : <div className="rounded-3xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm font-semibold text-slate-500 md:col-span-2">Nach einer vorbereiteten Verbindung werden Konten hier angezeigt.</div>}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-extrabold text-slate-950">Zahlungsabgleich</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">Sichere Treffer werden automatisch gebucht. Moegliche Treffer bleiben zur manuellen Pruefung stehen.</p>
            </div>
            <SearchCheck className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <div className="grid grid-cols-[0.8fr_0.7fr_1.1fr_1fr_1fr_0.9fr] gap-3 bg-gray-50 px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-400 max-xl:hidden">
              <span>Datum</span><span>Betrag</span><span>Verwendungszweck</span><span>Absender / Empfaenger</span><span>Rechnungs-Treffer</span><span>Status</span>
            </div>
            {reconciliation.length ? reconciliation.map((transaction) => (
              <div key={transaction.id} className="grid grid-cols-[0.8fr_0.7fr_1.1fr_1fr_1fr_0.9fr] gap-3 border-t border-gray-100 px-4 py-4 text-sm font-semibold text-slate-700 max-xl:grid-cols-1">
                <span>{formatDate(transaction.date)}</span>
                <span className="font-extrabold text-slate-950">{formatCurrency(transaction.amount, transaction.currency)}</span>
                <span>{transaction.purpose || "Ohne Verwendungszweck"}</span>
                <span>{transaction.counterparty || "Unbekannt"}</span>
                <span>
                  {transaction.suggestedInvoice ? (
                    <span className="block">
                      <strong className="block text-slate-950">Rechnung {transaction.suggestedInvoice.number} gefunden</strong>
                      <small className="font-semibold text-slate-500">{transaction.reasons.join(", ") || "Treffer vorbereitet"}</small>
                    </span>
                  ) : "Kein Treffer"}
                </span>
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-black text-slate-600">{transaction.matchStatus}</span>
                {transaction.invoicePaidByBankMatch ? <span className="col-span-full rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">Bezahlt durch Bankabgleich · {formatDate(transaction.invoicePaidByBankMatch.date)} · Bankbewegung {transaction.invoicePaidByBankMatch.bankTransactionId.slice(0, 8)}</span> : null}
                <div className="col-span-full grid gap-3 rounded-2xl bg-gray-50 p-3 md:grid-cols-[1fr_auto]">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Offene Rechnung auswaehlen
                    <select value={manualMatches[transaction.id] || transaction.suggestedInvoice?.id || ""} onChange={(event) => setManualMatches((current) => ({ ...current, [transaction.id]: event.target.value }))} className="mt-2 h-11 w-full rounded-full border border-gray-200 bg-white px-4 text-sm font-bold text-slate-700">
                      <option value="">Keine manuelle Zuordnung</option>
                      {openInvoices.map((invoice) => (
                        <option key={invoice.id} value={invoice.id}>{invoice.number} · {invoice.customer} · {formatCurrency(invoice.amount, "EUR")}</option>
                      ))}
                    </select>
                  </label>
                  <button type="button" disabled={isBusy} onClick={() => prepareManualMatch(transaction.id)} className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-sm font-extrabold text-[var(--brand-lime)] disabled:cursor-not-allowed disabled:opacity-60">
                    <ReceiptText className="h-4 w-4" />Zuordnung bestaetigen
                  </button>
                </div>
              </div>
            )) : <div className="border-t border-gray-100 px-4 py-8 text-center text-sm font-semibold text-slate-500">Noch keine BankTransactions vorhanden. Nach einer vorbereiteten Verbindung erscheinen Bankbewegungen hier.</div>}
          </div>
        </section>

        <section className="rounded-3xl border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-3"><ShieldCheck className="h-5 w-5 text-emerald-600" /><h2 className="text-xl font-extrabold text-slate-950">Sicherheit</h2></div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            {["Nur Admin/Owner", "Keine Bank-Zugangsdaten anzeigen", "Keine Tokens im Frontend", "Auto-Buchung nur bei sicherem Treffer"].map((item) => (
              <div key={item} className="rounded-2xl bg-gray-50 px-4 py-3 text-sm font-bold text-slate-700">{item}</div>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
