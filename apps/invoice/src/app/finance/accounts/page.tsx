"use client"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  Building2,
  Download,
  Landmark,
  Plus,
  Trash2,
  Upload,
  X
} from "lucide-react"
import { Currency, PageShell } from "@invoice-platform/ui"

type Account = {
  name: string
  iban: string
  balance: number
}

const initialAccounts: Account[] = [
  {
    name: "Hauptgeschäftskonto",
    iban: "DE12 3456 7890 1234 5678 90",
    balance: 124500
  },
  {
    name: "Steuerrücklagen",
    iban: "DE99 8877 6655 4433 2211 00",
    balance: 45000
  },
  {
    name: "PayPal Business",
    iban: "paypal@firma.de",
    balance: 3420
  }
]

export default function FinanceAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [showImportHistory, setShowImportHistory] = useState(false)
  const [accountName, setAccountName] = useState("")
  const [iban, setIban] = useState("")
  const [balance, setBalance] = useState("0")

  function addAccount() {
    if (!accountName.trim()) return

    setAccounts((items) => [
      ...items,
      {
        name: accountName.trim(),
        iban: iban.trim() || "Keine IBAN hinterlegt",
        balance: Number(balance) || 0
      }
    ])

    setAccountName("")
    setIban("")
    setBalance("0")
    setShowAccountModal(false)
  }

  function deleteAccount(name: string) {
    setAccounts((items) => items.filter((item) => item.name !== name))
  }

  const actionCards = [
    {
      title: "Transaktionen zuordnen",
      description: "6 offene Transaktionen warten auf Zuordnung",
      value: "6",
      icon: ArrowRight,
      active: true
    },
    {
      title: "EUR direkt klassifizieren",
      description: "8 Transaktionen für EUR offen",
      value: "8",
      icon: Landmark
    },
    {
      title: "CSV importieren",
      description: "Importieren Sie Transaktionen aus Ihrer Bank",
      icon: Download
    },
    {
      title: "Import-Historie",
      description: "Vergangene Importe einsehen und rückgängig machen",
      icon: Upload,
      onClick: () => setShowImportHistory(true)
    },
    {
      title: "Konten verwalten",
      description: "Erstellen und bearbeiten Sie Ihre Konten",
      icon: Plus,
      onClick: () => setShowAccountModal(true)
    }
  ]

  return (
    <PageShell
      title="Konten & Transaktionen"
      description="Verwalten Sie Ihre Konten und ordnen Sie Transaktionen zu."
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[var(--brand-lime)] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Neues Konto
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            Konto auswählen
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <select className="h-12 rounded-full bg-white px-5 text-sm font-bold text-slate-700 outline-none ring-1 ring-gray-200">
              {accounts.map((account) => (
                <option key={account.name}>{account.name}</option>
              ))}
            </select>

            <div className="flex h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-500 ring-1 ring-gray-200">
              Saldo: <span className="ml-2 font-extrabold text-slate-950"><Currency value={accounts[0]?.balance ?? 0} /></span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-5">
          {actionCards.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.title}
                type="button"
                onClick={item.onClick}
                className={`relative min-h-[220px] overflow-hidden rounded-3xl border p-6 text-left transition-all hover:bg-gray-100 ${
                  item.active
                    ? "border-blue-300 bg-blue-50 ring-2 ring-blue-200"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className={`flex h-12 w-12 items-center justify-center rounded-full ${
                    item.active ? "bg-blue-600 text-white" : "bg-black text-[var(--brand-lime)]"
                  }`}>
                    <Icon className="h-5 w-5" />
                  </span>

                  {item.active && (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-xs font-black text-white">
                      !
                    </span>
                  )}
                </div>

                {item.value && (
                  <p className="mt-8 text-3xl font-black text-slate-950">
                    {item.value}
                  </p>
                )}

                <h2 className={`${item.value ? "mt-2" : "mt-12"} text-lg font-black leading-tight text-slate-950`}>
                  {item.title}
                </h2>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {item.description}
                </p>
              </button>
            )
          })}
        </div>

        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <AlertCircle className="h-4 w-4" />
          </span>

          <div>
            <p className="font-extrabold text-amber-900">
              Sie haben 6 unzugeordnete Transaktionen
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              Ordnen Sie Transaktionen Ihren Rechnungen zu, um den Zahlungsstatus automatisch zu aktualisieren.
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-950">
            Ihre Konten
          </h2>

          <div className="mt-4 space-y-3">
            {accounts.map((account) => (
              <div
                key={account.name}
                className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
                    {account.name.includes("PayPal") ? <Banknote className="h-5 w-5" /> : <Building2 className="h-5 w-5" />}
                  </span>

                  <div className="min-w-0">
                    <p className="font-extrabold text-slate-950">{account.name}</p>
                    <p className="mt-1 truncate text-sm font-medium text-slate-500">{account.iban}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <p className="text-right text-lg font-extrabold text-slate-950">
                    <Currency value={account.balance} />
                  </p>

                  <button className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-gray-200">
                    Für Import
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAccount(account.name)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100"
                    aria-label="Konto löschen"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showAccountModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-950">
                  Neues Bankkonto
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Fügen Sie ein neues Konto hinzu
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Fenster schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <label className="block">
                <span className="text-sm font-bold text-slate-700">Kontoname *</span>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder="z.B. Geschäftskonto"
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">IBAN (optional)</span>
                <input
                  value={iban}
                  onChange={(event) => setIban(event.target.value)}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">Anfangssaldo</span>
                <input
                  value={balance}
                  onChange={(event) => setBalance(event.target.value)}
                  type="number"
                  placeholder="0"
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Abbrechen
              </button>

              <button
                type="button"
                onClick={addAccount}
                className="rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[var(--brand-lime)]"
              >
                Konto speichern
              </button>
            </div>
          </div>
        </div>
      )}

      {showImportHistory && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-[28px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-950">
                  Import-Historie
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Übersicht aller CSV-Importe mit Rollback-Möglichkeit
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowImportHistory(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                aria-label="Fenster schließen"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-[#f7f9fc] p-8 text-center">
              <Upload className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 text-base font-extrabold text-slate-900">
                Keine Importe vorhanden
              </p>
              <p className="mt-2 text-sm text-slate-500">
                Wähle einen Import aus der Liste
              </p>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportHistory(false)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                Schließen
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
