"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { ArrowLeft, CheckCircle2, Search, Sparkles } from "lucide-react"
import { Currency, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"

type TransactionType = "income" | "expense"

type Transaction = {
  date: string
  type: TransactionType
  party: string
  purpose: string
  amount: number
  suggestion: string
  keyword: string
}

type ClassificationState = {
  code: string
  vatMode: string
  privateTransfer: boolean
  saved: boolean
}

const transactions: Transaction[] = [
  {
    date: "2025-02-17",
    type: "expense",
    party: "Finanzamt Koeln",
    purpose: "Umsatzsteuervorauszahlung Jan 2025",
    amount: -990,
    suggestion: "186",
    keyword: "finanzamt"
  },
  {
    date: "2025-02-11",
    type: "expense",
    party: "Notion Labs",
    purpose: "Team-Abo Februar",
    amount: -74.99,
    suggestion: "228",
    keyword: "software"
  },
  {
    date: "2025-02-05",
    type: "expense",
    party: "Meta Ads",
    purpose: "Kampagne Leadgen Februar",
    amount: -145,
    suggestion: "224",
    keyword: "ads"
  },
  {
    date: "2025-02-03",
    type: "income",
    party: "StartUp Koeln AG",
    purpose: "Teilzahlung Strategieprojekt",
    amount: 1450,
    suggestion: "112",
    keyword: "rechnung"
  },
  {
    date: "2025-01-22",
    type: "income",
    party: "Kunde Shop #1143",
    purpose: "PayPal Checkout",
    amount: 680,
    suggestion: "112",
    keyword: "checkout"
  },
  {
    date: "2025-01-19",
    type: "expense",
    party: "Büro Center Koeln",
    purpose: "Büromaterial Q1",
    amount: -460,
    suggestion: "229",
    keyword: "buero"
  },
  {
    date: "2025-01-12",
    type: "expense",
    party: "Telekom Deutschland",
    purpose: "Internet & Telefon Januar",
    amount: -189,
    suggestion: "280",
    keyword: "telekom"
  },
  {
    date: "2025-01-08",
    type: "income",
    party: "Aurora Labs GmbH",
    purpose: "Abschlagszahlung Portal-Relaunch",
    amount: 2200,
    suggestion: "112",
    keyword: "kunde"
  }
]

const eurCodes = [
  ["110", "Bezogene Fremdleistungen"],
  ["120", "Ausgaben fuer eigenes Personal"],
  ["136", "AfA auf Grundstuecke/grundstuecksgleiche Rechte"],
  ["131", "AfA auf immaterielle Wirtschaftsgueter"],
  ["130", "AfA auf bewegliche Wirtschaftsgueter"],
  ["134", "Sonderabschreibungen nach § 7b / § 7g Abs. 5 und 6 EStG"],
  ["138", "Herabsetzungsbetraege nach § 7g Abs. 2 Satz 3 EStG"],
  ["132", "Aufwendungen fuer geringwertige Wirtschaftsgueter nach § 6 Abs. 2 EStG"],
  ["137", "Aufloesung Sammelposten nach § 6 Abs. 2a EStG"],
  ["135", "Restbuchwerte ausgeschiedener Anlagegueter"],
  ["150", "Miete/Pacht fuer Geschaeftsraeume und betrieblich genutzte Grundstuecke"],
  ["152", "Aufwendungen fuer doppelte Haushaltsfuehrung"],
  ["151", "Sonstige Aufwendungen fuer betrieblich genutzte Grundstuecke"],
  ["153", "In Zeile 151 enthaltene Erhaltungsaufwendungen"],
  ["280", "Aufwendungen fuer Telekommunikation"],
  ["221", "Uebernachtungs- und Reisenebenkosten bei Geschaeftsreisen"],
  ["281", "Fortbildungskosten (ohne Reisekosten)"],
  ["194", "Kosten fuer Rechts- und Steuerberatung, Buchfuehrung"],
  ["222", "Miete/Leasing fuer bewegliche Wirtschaftsgueter (ohne Kfz)"],
  ["225", "Erhaltungsaufwendungen (ohne Gebaeude und Kfz)"],
  ["223", "Beitraege, Gebuehren, Abgaben und Versicherungen (ohne Gebaeude und Kfz)"],
  ["228", "Laufende EDV-Kosten"],
  ["229", "Arbeitsmittel"],
  ["226", "Kosten fuer Abfallbeseitigung und Entsorgung"],
  ["227", "Kosten fuer Verpackung und Transport"],
  ["224", "Werbekosten"],
  ["232", "Schuldzinsen fuer Anlagevermoegen"],
  ["234", "Uebrige Schuldzinsen"],
  ["185", "Gezahlte und nach § 15 UStG abziehbare Vorsteuerbetraege"],
  ["186", "An das Finanzamt gezahlte und ggf. verrechnete Umsatzsteuer"],
  ["183", "Uebrige unbeschraenkt abziehbare Betriebsausgaben"],
  ["164", "Geschenke (abziehbarer Anteil)"],
  ["174", "Geschenke (nicht abziehbar)"],
  ["165", "Bewirtungsaufwendungen (abziehbarer Anteil)"],
  ["175", "Bewirtungsaufwendungen (nicht abziehbar)"],
  ["171", "Verpflegungsmehraufwendungen"],
  ["162", "Aufwendungen fuer ein haeusliches Arbeitszimmer (abziehbar)"],
  ["112", "Umsatzsteuerpflichtige Betriebseinnahmen"],
  ["103", "Umsatzsteuerfreie / nicht umsatzsteuerbare Betriebseinnahmen"]
] as const

const vatModes = [
  "Keine USt. Umrechnung",
  "Default USt. (Netto)",
  "Brutto mit 19% USt.",
  "Brutto mit 7% USt.",
  "Vorsteuer separat ausweisen"
]

function transactionKey(transaction: Transaction) {
  return `${transaction.date}-${transaction.party}`
}

function codeLabel(code: string) {
  const option = eurCodes.find(([value]) => value === code)
  return option ? `${option[0]} - ${option[1]}` : code
}

export default function EurClassificationPage() {
  const { t } = useLanguage()
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<string[]>([transactionKey(transactions[0])])
  const [activeKey, setActiveKey] = useState(transactionKey(transactions[0]))
  const [classification, setClassification] = useState<Record<string, ClassificationState>>(() => ({
    [transactionKey(transactions[0])]: {
      code: transactions[0].suggestion,
      vatMode: "Keine USt. Umrechnung",
      privateTransfer: false,
      saved: false
    }
  }))

  const typeLabel = (type: TransactionType) => type === "income" ? t("finance.accounts.eur.income") : t("finance.accounts.eur.expense")

  const filteredTransactions = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return transactions

    return transactions.filter((transaction) =>
      [transaction.date, transaction.type, transaction.party, transaction.purpose, String(transaction.amount), transaction.keyword]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    )
  }, [query])

  const visibleKeys = filteredTransactions.map(transactionKey)
  const activeTransaction = transactions.find((transaction) => transactionKey(transaction) === activeKey) ?? transactions[0]
  const activeClassification = classification[activeKey] ?? {
    code: activeTransaction.suggestion,
    vatMode: "Keine USt. Umrechnung",
    privateTransfer: false,
    saved: false
  }

  function toggleSelected(key: string) {
    setSelected((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key])
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

  function applySuggestion(keys = selected) {
    setClassification((items) => {
      const next = { ...items }

      for (const key of keys) {
        const transaction = transactions.find((item) => transactionKey(item) === key)
        if (!transaction) continue
        next[key] = {
          ...(next[key] ?? {
            vatMode: "Keine USt. Umrechnung",
            privateTransfer: false,
            saved: false
          }),
          code: transaction.suggestion
        }
      }

      return next
    })
  }

  function saveClassification() {
    setClassification((items) => ({
      ...items,
      [activeKey]: {
        ...activeClassification,
        saved: true
      }
    }))
  }

  function resetClassification() {
    setClassification((items) => ({
      ...items,
      [activeKey]: {
        code: activeTransaction.suggestion,
        vatMode: "Keine USt. Umrechnung",
        privateTransfer: false,
        saved: false
      }
    }))
  }

  return (
    <PageShell title={t("finance.accounts.eur.title")} description={t("finance.accounts.eur.description")}>
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            <ArrowLeft className="h-4 w-4" />
            {t("finance.accounts.eur.back")}
          </Link>

          <div className="inline-flex w-fit rounded-full bg-[#eef2f7] p-1">
            <Link href="/finance/accounts/assign" className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 no-underline">{t("finance.accounts.assign.matchInvoices")}</Link>
            <button type="button" className="rounded-full bg-white px-4 py-2 text-sm font-extrabold text-slate-950 shadow-sm">{t("finance.accounts.assign.classifyEur")}</button>
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[100px_1fr_190px_150px_170px_auto_auto]">
          <select className="h-11 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200"><option>2025</option></select>
          <label className="flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-slate-500 ring-1 ring-slate-200">
            <Search className="h-4 w-4" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("finance.accounts.eur.search")}
              className="min-w-0 flex-1 bg-transparent outline-none"
            />
          </label>
          <select className="h-11 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200"><option>{t("finance.accounts.eur.unclassified")}</option></select>
          <select className="h-11 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200"><option>{t("finance.accounts.eur.allTypes")}</option></select>
          <select className="h-11 rounded-full bg-white px-4 text-sm font-semibold text-slate-600 outline-none ring-1 ring-slate-200"><option>{t("finance.accounts.eur.newestFirst")}</option></select>
          <button type="button" onClick={() => setSelected(visibleKeys)} className="h-11 rounded-full bg-white px-4 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">{t("finance.accounts.eur.selectAll")}</button>
          <button type="button" onClick={() => setSelected([])} className="h-11 rounded-full bg-white px-4 text-sm font-extrabold text-slate-800 ring-1 ring-slate-200">{t("finance.accounts.eur.clearSelection")}</button>
        </div>

        <div className="grid overflow-hidden rounded-[28px] border border-slate-200 bg-white xl:grid-cols-[0.98fr_1.02fr]">
          <section className="max-h-[760px] overflow-y-auto border-r border-slate-200 bg-white p-5">
            <div className="rounded-[28px] border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold text-slate-500">Bulk-Aktionen ({selected.length} ausgewählt)</p>
              <div className="mt-3 grid gap-2">
                <button type="button" onClick={() => applySuggestion()} className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-left text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-blue-50">
                  <Sparkles className="h-4 w-4 text-blue-500" />
                  {t("finance.accounts.eur.applySuggestion")}
                </button>
                <button type="button" onClick={() => selected.forEach((key) => {
                  if (key === activeKey) updateClassification({ privateTransfer: true })
                })} className="rounded-full bg-white px-4 py-2.5 text-left text-sm font-extrabold text-slate-700 ring-1 ring-slate-200 hover:bg-red-50">
                  {t("finance.accounts.eur.markPrivate")}
                </button>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {filteredTransactions.map((transaction) => {
                const key = transactionKey(transaction)
                const isSelected = selected.includes(key)
                const isActive = activeKey === key
                const state = classification[key]
                const isSaved = Boolean(state?.saved)
                const isPrivateTransfer = Boolean(state?.privateTransfer)

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActiveKey(key)
                      if (!selected.includes(key)) setSelected((items) => [...items, key])
                    }}
                    className={`w-full rounded-[28px] border p-5 text-left transition ${isActive ? "border-slate-950 bg-white shadow-sm" : "border-slate-200 bg-white hover:border-slate-300"}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(event) => {
                          event.stopPropagation()
                          toggleSelected(key)
                        }}
                        onClick={(event) => event.stopPropagation()}
                        className="mt-1 h-4 w-4 accent-blue-600"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
                          <span>{transaction.date}</span>
                          <span>|</span>
                          <span>{typeLabel(transaction.type)}</span>
                        </div>
                        <h3 className="mt-2 text-lg font-extrabold text-slate-950">{transaction.party}</h3>
                        <p className="mt-1 text-sm font-semibold text-slate-500">{transaction.purpose}</p>
                        <p className={transaction.amount > 0 ? "mt-3 text-lg font-black text-emerald-600" : "mt-3 text-lg font-black text-red-600"}>
                          {transaction.amount > 0 ? "+" : "-"}<Currency value={Math.abs(transaction.amount)} />
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className={isSaved ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700" : "rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700"}>
                            {isSaved ? "Klassifiziert" : t("finance.accounts.eur.open")}
                          </span>
                          {isPrivateTransfer ? <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">Transfer</span> : null}
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">{t("finance.accounts.eur.suggestion")}</span>
                        </div>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="max-h-[760px] overflow-y-auto bg-white p-6">
            <div className="rounded-[28px] border border-slate-200 bg-white p-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-950">{activeTransaction.party}</h2>
                <p className="mt-1 text-base font-semibold text-slate-500">{activeTransaction.purpose}</p>
                <p className={activeTransaction.amount > 0 ? "mt-3 text-lg font-black text-emerald-600" : "mt-3 text-lg font-black text-slate-950"}>
                  <Currency value={Math.abs(activeTransaction.amount)} />
                </p>
              </div>

              <button
                type="button"
                onClick={() => applySuggestion([activeKey])}
                className="mt-6 w-full rounded-[22px] border border-blue-200 bg-blue-50 px-4 py-3 text-left text-sm font-extrabold text-blue-700 hover:bg-blue-100"
              >
                Vorschlag übernehmen
                <span className="block text-xs font-semibold">Mock-Vorschlag per Stichwort ({activeTransaction.keyword})</span>
              </button>

              <div className="mt-6 space-y-5">
                <label className="block">
                  <span className="text-sm font-extrabold text-slate-600">Kennziffer</span>
                  <select
                    value={activeClassification.code}
                    onChange={(event) => updateClassification({ code: event.target.value, saved: false })}
                    className="mt-2 h-12 w-full rounded-full bg-white px-4 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-600"
                  >
                    {eurCodes.map(([code, label]) => (
                      <option key={code} value={code}>{code} - {label}</option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-sm font-extrabold text-slate-600">USt. Modus</span>
                  <select
                    value={activeClassification.vatMode}
                    onChange={(event) => updateClassification({ vatMode: event.target.value, saved: false })}
                    className="mt-2 h-12 w-full rounded-full bg-white px-4 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-300 focus:ring-2 focus:ring-blue-600"
                  >
                    {vatModes.map((mode) => (
                      <option key={mode}>{mode}</option>
                    ))}
                  </select>
                </label>

                <label className="flex items-center gap-3 text-sm font-semibold text-slate-700">
                  <input
                    type="checkbox"
                    checked={activeClassification.privateTransfer}
                    onChange={(event) => updateClassification({ privateTransfer: event.target.checked, saved: false })}
                    className="h-4 w-4 rounded border-slate-300 accent-slate-900"
                  />
                  Privat/Transfer ausschließen
                </label>
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button type="button" onClick={saveClassification} className="rounded-full bg-[var(--brand-lime)] px-6 py-3 text-sm font-black text-black shadow-sm">
                  Klassifizierung speichern
                </button>
                <button type="button" onClick={resetClassification} className="rounded-full bg-white px-6 py-3 text-sm font-extrabold text-slate-700 ring-1 ring-slate-200">
                  Zurücksetzen
                </button>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-4 text-sm font-semibold text-slate-500">
                <CheckCircle2 className="mr-2 inline h-4 w-4 text-slate-400" />
                Änderungen sind sofort im EÜR-Report und Export sichtbar.
              </div>

              {activeClassification.saved ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-extrabold text-emerald-700">
                  Gespeichert: {codeLabel(activeClassification.code)}
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
