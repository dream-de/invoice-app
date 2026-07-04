"use client"

import { useRouter } from "next/navigation"
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
import { Currency, PageShell } from "@dream-invoice/ui"
import { useLanguage } from "@/lib/i18n"
import { StandardModal } from "@/components/ui/StandardModal"

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
  const [selectedAccountName, setSelectedAccountName] = useState(initialAccounts[0]?.name ?? "")
  const { t } = useLanguage()
  const router = useRouter()

  const selectedAccount = accounts.find((account) => account.name === selectedAccountName) ?? accounts[0]

  function addAccount() {
    if (!accountName.trim()) return

    const nextAccount = {
      name: accountName.trim(),
      iban: iban.trim() || t("finance.accounts.missingIban"),
      balance: Number(balance) || 0
    }

    setAccounts((items) => [...items, nextAccount])
    setSelectedAccountName(nextAccount.name)

    setAccountName("")
    setIban("")
    setBalance("0")
    setShowAccountModal(false)
  }

  function deleteAccount(name: string) {
    setAccounts((items) => {
      const next = items.filter((item) => item.name !== name)
      if (selectedAccountName === name) {
        setSelectedAccountName(next[0]?.name ?? "")
      }
      return next
    })
  }

  const actionCards = [
    {
      title: t("finance.accounts.cards.assign.title"),
      description: t("finance.accounts.cards.assign.description"),
      value: "6",
      icon: ArrowRight,
      href: "/finance/accounts/assign",
      active: true
    },
    {
      title: t("finance.accounts.cards.eur.title"),
      description: t("finance.accounts.cards.eur.description"),
      value: "8",
      icon: Landmark,
      href: "/finance/accounts/eur"
    },
    {
      title: t("finance.accounts.cards.csv.title"),
      description: t("finance.accounts.cards.csv.description"),
      icon: Download,
      href: "/finance/accounts/import"
    },
    {
      title: t("finance.accounts.cards.history.title"),
      description: t("finance.accounts.cards.history.description"),
      icon: Upload,
      href: "/finance/accounts/history",
      onClick: () => setShowImportHistory(true)
    },
    {
      title: t("finance.accounts.cards.manage.title"),
      description: t("finance.accounts.cards.manage.description"),
      icon: Plus,
      href: "/finance/accounts/manage",
      onClick: () => setShowAccountModal(true)
    }
  ]

  return (
    <PageShell
      title={t("finance.accounts.title")}
      description={t("finance.accounts.description")}
    >
      <div className="space-y-6">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setShowAccountModal(true)}
            className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-[var(--brand-lime)] shadow-sm"
          >
            <Plus className="h-4 w-4" />
            {t("finance.accounts.actions.newAccount")}
          </button>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
            {t("finance.accounts.selectAccount")}
          </p>

          <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
            <select
              value={selectedAccountName}
              onChange={(event) => setSelectedAccountName(event.target.value)}
              className="h-12 rounded-full bg-white px-5 text-sm font-bold text-slate-700 outline-none ring-1 ring-gray-200"
            >
              {accounts.map((account) => (
                <option key={account.name} value={account.name}>{account.name}</option>
              ))}
            </select>

            <div className="flex h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-slate-500 ring-1 ring-gray-200">
              {t("finance.accounts.balance")}: <span className="ml-2 font-extrabold text-slate-950"><Currency value={selectedAccount?.balance ?? 0} /></span>
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
                onClick={() => {
                  if (item.href) {
                    router.push(item.href)
                    return
                  }
                  item.onClick?.()
                }}
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
              {t("finance.accounts.warning.title")}
            </p>
            <p className="mt-1 text-sm leading-6 text-amber-800">
              {t("finance.accounts.warning.description")}
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-extrabold text-slate-950">
            {t("finance.accounts.yourAccounts")}
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

                  <button
                    type="button"
                    onClick={() => router.push("/finance/accounts/import")}
                    className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-600 ring-1 ring-gray-200"
                  >
                    {t("finance.accounts.forImport")}
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteAccount(account.name)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100"
                    aria-label={t("finance.accounts.deleteAccount")}
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
        <StandardModal
          title={t("finance.accounts.modal.newAccount.title")}
          description={t("finance.accounts.modal.newAccount.description")}
          onClose={() => setShowAccountModal(false)}
          width={520}
          bodyClassName="space-y-4"
        >
              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t("finance.accounts.modal.newAccount.nameRequired")}</span>
                <input
                  value={accountName}
                  onChange={(event) => setAccountName(event.target.value)}
                  placeholder={t("finance.accounts.modal.newAccount.namePlaceholder")}
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t("finance.accounts.modal.newAccount.ibanOptional")}</span>
                <input
                  value={iban}
                  onChange={(event) => setIban(event.target.value)}
                  placeholder="DE89 3704 0044 0532 0130 00"
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>

              <label className="block">
                <span className="text-sm font-bold text-slate-700">{t("finance.accounts.modal.newAccount.openingBalance")}</span>
                <input
                  value={balance}
                  onChange={(event) => setBalance(event.target.value)}
                  type="number"
                  placeholder="0"
                  className="mt-2 h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900"
                />
              </label>
        </StandardModal>
      )}

      {showImportHistory && (
        <StandardModal
          title={t("finance.accounts.modal.history.title")}
          description={t("finance.accounts.modal.history.rollbackDescription")}
          onClose={() => setShowImportHistory(false)}
          width={560}
        >

            <div className="mt-8 rounded-3xl border border-dashed border-slate-200 bg-[#f7f9fc] p-8 text-center">
              <Upload className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-4 text-base font-extrabold text-slate-900">
                {t("finance.accounts.modal.history.emptyTitle")}
              </p>
              <p className="mt-2 text-sm text-slate-500">
                {t("finance.accounts.modal.history.pickImport")}
              </p>
            </div>

            <div className="mt-7 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportHistory(false)}
                className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200"
              >
                {t("finance.accounts.modal.close")}
              </button>
            </div>
        </StandardModal>
      )}
    </PageShell>
  )
}
