"use client"

import { ArrowLeft, CheckCircle2, Download, FileText, RotateCcw, Search, SlidersHorizontal, Sparkles } from "lucide-react"
import Link from "next/link"
import { useMemo, useState } from "react"
import { Currency } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type TransactionStatus = "open" | "classified" | "excluded"
type TransactionType = "income" | "expense"

type Transaction = {
  date: string
  source: string
  name: string
  text: string
  amount: number
  type: TransactionType
  suggestion: string
  keyword: string
}

type ClassificationState = {
  code: string
  vatMode: string
  privateTransfer: boolean
  status: TransactionStatus
}

const transactions: Transaction[] = [
  { date: "2025-02-17", source: "Bank", name: "Finanzamt Koeln", text: "Umsatzsteuervorauszahlung Jan 2025", amount: -990, type: "expense", suggestion: "186", keyword: "finanzamt" },
  { date: "2025-02-11", source: "Bank", name: "Notion Labs", text: "Team-Abo Februar", amount: -74.99, type: "expense", suggestion: "228", keyword: "software" },
  { date: "2025-02-05", source: "Bank", name: "Meta Ads", text: "Kampagne Leadgen Februar", amount: -145, type: "expense", suggestion: "224", keyword: "ads" },
  { date: "2025-02-03", source: "Bank", name: "StartUp Koeln AG", text: "Teilzahlung Strategieprojekt", amount: 1450, type: "income", suggestion: "112", keyword: "rechnung" },
  { date: "2025-01-22", source: "Bank", name: "Kunde Shop #1143", text: "PayPal Checkout", amount: 680, type: "income", suggestion: "112", keyword: "checkout" },
  { date: "2025-01-19", source: "Bank", name: "Büro Center Koeln", text: "Büromaterial Q1", amount: -460, type: "expense", suggestion: "229", keyword: "buero" },
  { date: "2025-01-12", source: "Bank", name: "Telekom Deutschland", text: "Internet & Telefon Januar", amount: -189, type: "expense", suggestion: "280", keyword: "telekom" },
  { date: "2025-01-08", source: "Bank", name: "Aurora Labs GmbH", text: "Abschlagszahlung Portal-Relaunch", amount: 2200, type: "income", suggestion: "112", keyword: "kunde" }
]

const eurCodes = [
  ["111", "Betriebseinnahmen als umsatzsteuerlicher Kleinunternehmer"],
  ["112", "Umsatzsteuerpflichtige Betriebseinnahmen"],
  ["103", "Umsatzsteuerfreie / nicht umsatzsteuerbare Betriebseinnahmen"],
  ["100", "Waren, Rohstoffe und Hilfsstoffe"],
  ["110", "Bezogene Fremdleistungen"],
  ["120", "Ausgaben fuer eigenes Personal"],
  ["150", "Miete/Pacht fuer Geschaeftsraeume"],
  ["185", "Gezahlte und nach § 15 UStG abziehbare Vorsteuerbetraege"],
  ["186", "An das Finanzamt gezahlte und ggf. verrechnete Umsatzsteuer"],
  ["194", "Kosten fuer Rechts- und Steuerberatung, Buchfuehrung"],
  ["224", "Werbekosten"],
  ["228", "Laufende EDV-Kosten"],
  ["229", "Arbeitsmittel"],
  ["280", "Aufwendungen fuer Telekommunikation"]
] as const

const vatModes = [
  "Keine USt. Umrechnung",
  "Default USt. (Netto)",
  "Brutto mit 19% USt.",
  "Brutto mit 7% USt.",
  "Vorsteuer separat ausweisen"
]

function transactionKey(transaction: Transaction) {
  return `${transaction.date}-${transaction.name}`
}

function codeLabel(code: string) {
  const option = eurCodes.find(([value]) => value === code)
  return option ? `${option[0]} - ${option[1]}` : code
}

export default function EurPage() {
  const { t } = useLanguage()
  const [activeKey, setActiveKey] = useState(transactionKey(transactions[0]))
  const [selectedKeys, setSelectedKeys] = useState<string[]>([])
  const [query, setQuery] = useState("")
  const [tab, setTab] = useState<TransactionStatus | "all">("open")
  const [typeFilter, setTypeFilter] = useState<"all" | TransactionType>("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "amount">("newest")
  const [classification, setClassification] = useState<Record<string, ClassificationState>>(() => ({
    [transactionKey(transactions[0])]: {
      code: transactions[0].suggestion,
      vatMode: "Keine USt. Umrechnung",
      privateTransfer: false,
      status: "open"
    }
  }))

  const activeTransaction = transactions.find((item) => transactionKey(item) === activeKey) ?? transactions[0]
  const activeClassification = classification[activeKey] ?? {
    code: activeTransaction.suggestion,
    vatMode: "Keine USt. Umrechnung",
    privateTransfer: false,
    status: "open"
  }

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase()

    return transactions
      .filter((transaction) => {
        const state = classification[transactionKey(transaction)]
        const status = state?.status ?? "open"
        if (tab !== "all" && status !== tab) return false
        if (typeFilter !== "all" && transaction.type !== typeFilter) return false
        if (!needle) return true
        return [transaction.date, transaction.source, transaction.name, transaction.text, transaction.keyword, String(transaction.amount)]
          .join(" ")
          .toLowerCase()
          .includes(needle)
      })
      .sort((a, b) => sortOrder === "amount" ? Math.abs(b.amount) - Math.abs(a.amount) : b.date.localeCompare(a.date))
  }, [classification, query, sortOrder, tab, typeFilter])

  const openCount = transactions.filter((transaction) => (classification[transactionKey(transaction)]?.status ?? "open") === "open").length
  const classifiedCount = transactions.filter((transaction) => classification[transactionKey(transaction)]?.status === "classified").length
  const excludedCount = transactions.filter((transaction) => classification[transactionKey(transaction)]?.status === "excluded").length
  const revenue = transactions.filter((transaction) => transaction.amount > 0).reduce((sum, transaction) => sum + transaction.amount, 0)
  const expenses = transactions.filter((transaction) => transaction.amount < 0).reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
  const visibleKeys = filteredTransactions.map(transactionKey)

  function toggleSelected(key: string) {
    setSelectedKeys((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])
  }

  function updateClassification(next: Partial<ClassificationState>) {
    setClassification((items) => ({
      ...items,
      [activeKey]: {
        ...activeClassification,
        ...next
      }
    }))
  }

  function applySuggestion(keys = selectedKeys.length > 0 ? selectedKeys : [activeKey]) {
    setClassification((items) => {
      const next = { ...items }
      for (const key of keys) {
        const transaction = transactions.find((item) => transactionKey(item) === key)
        if (!transaction) continue
        next[key] = {
          ...(next[key] ?? {
            vatMode: "Keine USt. Umrechnung",
            privateTransfer: false,
            status: "open"
          }),
          code: transaction.suggestion,
          status: "classified"
        }
      }
      return next
    })
  }

  function markPrivate(keys = selectedKeys.length > 0 ? selectedKeys : [activeKey]) {
    setClassification((items) => {
      const next = { ...items }
      for (const key of keys) {
        const transaction = transactions.find((item) => transactionKey(item) === key)
        if (!transaction) continue
        next[key] = {
          ...(next[key] ?? {
            code: transaction.suggestion,
            vatMode: "Keine USt. Umrechnung",
            privateTransfer: false
          }),
          privateTransfer: true,
          status: "excluded"
        }
      }
      return next
    })
  }

  function resetClassification(keys = selectedKeys.length > 0 ? selectedKeys : [activeKey]) {
    setClassification((items) => {
      const next = { ...items }
      for (const key of keys) {
        delete next[key]
      }
      return next
    })
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <section className="rounded-[34px] border border-[#e3e9f1] bg-[#f8f9fb] p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
        <div className="mb-7 flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/finance" className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">
              <ArrowLeft className="h-5 w-5" />
            </Link>

            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-[var(--brand-lime)] shadow-sm">
              <FileText className="h-7 w-7" />
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-[#151b2b]">{t("finance.eur.title")}</h1>
              <p className="mt-1 text-sm font-medium text-[#64748b]">
                {t("finance.eur.description")}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full border border-[#dfe5ed] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f2937]">2025</button>
            <button type="button" className="inline-flex items-center gap-2 rounded-full border border-[#dfe5ed] bg-white px-5 py-2.5 text-sm font-semibold text-[#1f2937]">
              <SlidersHorizontal className="h-4 w-4" />
              {t("finance.eur.rules")}
            </button>
            <a href="/api/finance/datev-export" className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white no-underline">
              <Download className="h-4 w-4" />
              {t("finance.eur.exportCsv")}
            </a>
            <button type="button" className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-semibold text-[#1f2937]">
              <Download className="h-4 w-4" />
              {t("finance.eur.exportPdf")}
            </button>
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.queue")}</h2>
              <span className="text-sm font-medium text-[#7b8799]">{t("finance.eur.entries").replace("{count}", String(filteredTransactions.length))}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 rounded-[22px] border border-[#e6ebf1] bg-[#f7f9fc] p-2 text-center text-sm font-semibold text-[#64748b]">
              {[
                ["open", t("finance.eur.tabs.open").replace("{count}", String(openCount))],
                ["classified", t("finance.eur.tabs.classified").replace("0", String(classifiedCount))],
                ["excluded", t("finance.eur.tabs.excluded").replace("0", String(excludedCount))],
                ["all", t("finance.eur.tabs.all").replace("{count}", String(transactions.length))]
              ].map(([value, label]) => (
                <button key={value} type="button" onClick={() => setTab(value as TransactionStatus | "all")} className={tab === value ? "rounded-full bg-white px-4 py-2 text-[#151b2b] shadow-sm" : "rounded-full px-4 py-2"}>
                  {label}
                </button>
              ))}
            </div>

            <label className="mt-4 flex items-center gap-3 rounded-full border border-[#e1e7ef] bg-white px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full bg-transparent text-sm font-medium outline-none placeholder:text-slate-400"
                placeholder={t("finance.eur.search")}
              />
            </label>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as "all" | TransactionType)} className="rounded-full border border-[#e1e7ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2937]">
                <option value="all">{t("finance.eur.allTypes")}</option>
                <option value="income">{t("finance.accounts.eur.income")}</option>
                <option value="expense">{t("finance.accounts.eur.expense")}</option>
              </select>
              <select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as "newest" | "amount")} className="rounded-full border border-[#e1e7ef] bg-white px-4 py-2.5 text-sm font-semibold text-[#1f2937]">
                <option value="newest">{t("finance.eur.newestFirst")}</option>
                <option value="amount">Hoechster Betrag</option>
              </select>
            </div>

            <div className="mt-4 rounded-[22px] border border-[#e6ebf1] bg-[#f7f9fc] p-3">
              <div className="mb-3 flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 font-semibold text-[#334155]">
                  <input
                    type="checkbox"
                    checked={selectedKeys.length > 0 && visibleKeys.every((key) => selectedKeys.includes(key))}
                    onChange={(event) => setSelectedKeys(event.target.checked ? visibleKeys : [])}
                    className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                  />
                  {t("finance.eur.selectedCount").replace("0", String(selectedKeys.length))}
                </label>
                <button type="button" onClick={() => setSelectedKeys([])} className="font-medium text-[#64748b]">{t("finance.eur.clearSelection")}</button>
              </div>

              <div className="grid gap-2">
                <button type="button" onClick={() => applySuggestion()} className="rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:bg-blue-50">{t("finance.eur.applySuggestion")}</button>
                <button type="button" onClick={() => markPrivate()} className="rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:bg-red-50">{t("finance.eur.markPrivate")}</button>
                <button type="button" onClick={() => resetClassification()} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-left text-sm font-medium text-[#475569] hover:bg-slate-50">
                  <RotateCcw className="h-4 w-4" />
                  {t("finance.eur.resetClassification")}
                </button>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              {filteredTransactions.map((item) => {
                const key = transactionKey(item)
                const state = classification[key]
                const status = state?.status ?? "open"

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveKey(key)
                      if (!selectedKeys.includes(key)) setSelectedKeys((items) => [...items, key])
                    }}
                    className={`w-full rounded-[22px] border p-4 text-left transition ${activeKey === key ? "border-black bg-white shadow-md" : "border-[#e5eaf0] bg-white hover:border-[#cfd8e5] hover:shadow-sm"}`}
                  >
                    <div className="mb-2 flex items-center justify-between gap-3 text-xs font-semibold text-[#7b8799]">
                      <span className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedKeys.includes(key)}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => toggleSelected(key)}
                          className="h-4 w-4 accent-blue-600"
                        />
                        {item.date} <span>|</span> {item.source}
                      </span>
                      <span className={item.amount > 0 ? "text-emerald-600" : "text-red-500"}>
                        {item.amount > 0 ? "+" : "-"}<Currency value={Math.abs(item.amount)} />
                      </span>
                    </div>

                    <p className="text-base font-extrabold text-[#111827]">{item.name}</p>
                    <p className="mt-1 text-sm font-medium text-[#64748b]">{item.text}</p>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className={status === "classified" ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : status === "excluded" ? "rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700" : "rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700"}>
                        {status === "classified" ? "Klassifiziert" : status === "excluded" ? "Ausgeschlossen" : t("finance.eur.open")}
                      </span>
                      <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-bold text-[#475569]">{item.type === "income" ? t("finance.accounts.eur.income") : t("finance.accounts.eur.expense")}</span>
                      <span className="rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-bold text-[#475569]">{item.keyword}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="space-y-5">
            <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.classification")}</h2>

              <div className="mt-5 rounded-[24px] border border-[#d8e0ea] bg-[#f7f9fc] p-6">
                <p className="text-xl font-extrabold text-[#151b2b]">{activeTransaction.name}</p>
                <p className="mt-2 text-sm font-semibold text-[#64748b]">{activeTransaction.text}</p>
                <p className={activeTransaction.amount > 0 ? "mt-3 text-lg font-black text-emerald-600" : "mt-3 text-lg font-black text-red-600"}>
                  {activeTransaction.amount > 0 ? "+" : "-"}<Currency value={Math.abs(activeTransaction.amount)} />
                </p>

                <button type="button" onClick={() => applySuggestion([activeKey])} className="mt-5 inline-flex w-full items-center gap-2 rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-extrabold text-blue-700 hover:bg-blue-100">
                  <Sparkles className="h-4 w-4" />
                  <span>
                    Vorschlag übernehmen
                    <span className="block text-xs font-semibold">Mock-Vorschlag per Stichwort ({activeTransaction.keyword})</span>
                  </span>
                </button>

                <label className="mt-5 block">
                  <span className="text-sm font-extrabold text-slate-600">Kennziffer</span>
                  <select value={activeClassification.code} onChange={(event) => updateClassification({ code: event.target.value, status: "open" })} className="mt-2 h-12 w-full rounded-full bg-white px-4 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-600">
                    {eurCodes.map(([code, label]) => (
                      <option key={code} value={code}>{code} - {label}</option>
                    ))}
                  </select>
                </label>

                <label className="mt-5 block">
                  <span className="text-sm font-extrabold text-slate-600">USt. Modus</span>
                  <select value={activeClassification.vatMode} onChange={(event) => updateClassification({ vatMode: event.target.value, status: "open" })} className="mt-2 h-12 w-full rounded-full bg-white px-4 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-600">
                    {vatModes.map((mode) => <option key={mode}>{mode}</option>)}
                  </select>
                </label>

                <label className="mt-5 flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input checked={activeClassification.privateTransfer} onChange={(event) => updateClassification({ privateTransfer: event.target.checked, status: event.target.checked ? "excluded" : "open" })} type="checkbox" className="h-4 w-4 rounded border-slate-300 accent-slate-900" />
                  Privat/Transfer ausschließen
                </label>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button type="button" onClick={() => updateClassification({ status: "classified" })} className="rounded-full bg-[var(--brand-lime)] px-6 py-3 text-sm font-black text-black shadow-sm">Klassifizierung speichern</button>
                  <button type="button" onClick={() => resetClassification([activeKey])} className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">Zurücksetzen</button>
                </div>

                <p className="mt-5 border-t border-slate-200 pt-4 text-sm font-semibold text-slate-500">
                  <CheckCircle2 className="mr-2 inline h-4 w-4 text-slate-400" />
                  Änderungen sind sofort im EÜR-Report und Export sichtbar.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-[#e1e7ef] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-extrabold text-[#151b2b]">{t("finance.eur.report")}</h2>

              <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {[
                  [t("finance.eur.revenue"), revenue],
                  [t("finance.eur.expenses"), expenses],
                  [t("finance.eur.surplus"), revenue - expenses],
                  [t("finance.eur.unclassified"), openCount]
                ].map(([label, value]) => (
                  <div key={label} className="rounded-[20px] bg-[#f7f9fc] p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[#94a3b8]">{label}</p>
                    <p className="mt-2 text-lg font-extrabold text-[#111827]">
                      {label === t("finance.eur.unclassified") ? value : <Currency value={Number(value)} />}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e5eaf0]">
                <table className="w-full text-sm">
                  <thead className="bg-[#f7f9fc] text-left text-xs font-bold uppercase tracking-widest text-[#64748b]">
                    <tr>
                      <th className="px-4 py-3">{t("finance.eur.code")}</th>
                      <th className="px-4 py-3">{t("finance.eur.label")}</th>
                      <th className="px-4 py-3 text-right">{t("finance.eur.amount")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#edf2f7] bg-white">
                    {eurCodes.map(([code, label]) => {
                      const amount = transactions
                        .filter((transaction) => classification[transactionKey(transaction)]?.code === code && classification[transactionKey(transaction)]?.status === "classified")
                        .reduce((sum, transaction) => sum + Math.abs(transaction.amount), 0)
                      return (
                        <tr key={code} className="hover:bg-[#f8fafc]">
                          <td className="px-4 py-3 font-bold text-[#475569]">{code}</td>
                          <td className="px-4 py-3 font-medium text-[#334155]">{label}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#111827]"><Currency value={amount} /></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
