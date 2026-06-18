"use client"

import { useEffect, useMemo, useState } from "react"
import { AlertCircle, BadgeEuro, CalendarDays, CreditCard, Landmark, LockKeyhole, Plus, QrCode, RefreshCw, ScrollText, ShieldCheck, Trash2 } from "lucide-react"
import { Field, SettingCard, SoftInput, SoftTextarea } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"
import { useLanguage } from "@/lib/i18n"

type BankAccountForm = {
  id: string
  bankName: string
  accountHolder: string
  iban: string
  bic: string
  isDefault: boolean
  qrEnabled: boolean
  active: boolean
}

type PaymentMethodForm = {
  key: string
  label: string
  enabled: boolean
  prepared: boolean
  sortOrder: number
}

type PaymentProviderForm = {
  provider: "paypal" | "stripe" | "finapi"
  apiKey: string
  secretKey: string
  webhookUrl: string
  enabled: boolean
}

type PaymentTermForm = {
  id?: string
  label: string
  days: number
  isDefault: boolean
  active: boolean
  sortOrder: number
}

type ReminderPreparationForm = {
  level: number
  label: string
  daysAfterDue: number
  active: boolean
  templateNote?: string | null
}

type FinanceForm = {
  company: string
  taxNumber: string
  vatId: string
  registerCourt: string
  defaultPaymentNote: string
  bankAccounts: BankAccountForm[]
  paymentMethods: PaymentMethodForm[]
  paymentProviderConfigs: PaymentProviderForm[]
  paymentTerms: PaymentTermForm[]
  reminderPreparation: ReminderPreparationForm[]
}

const defaultMethods: PaymentMethodForm[] = [
  { key: "bank_transfer", label: "Ueberweisung", enabled: true, prepared: false, sortOrder: 10 },
  { key: "cash", label: "Bar", enabled: true, prepared: false, sortOrder: 20 },
  { key: "ec_card", label: "EC-Karte", enabled: true, prepared: false, sortOrder: 30 },
  { key: "credit_card", label: "Kreditkarte", enabled: true, prepared: false, sortOrder: 40 },
  { key: "paypal", label: "PayPal", enabled: false, prepared: true, sortOrder: 50 },
  { key: "stripe", label: "Stripe", enabled: false, prepared: true, sortOrder: 60 }
]

const defaultTerms: PaymentTermForm[] = [
  { label: "Sofort faellig", days: 0, isDefault: false, active: true, sortOrder: 10 },
  { label: "7 Tage", days: 7, isDefault: false, active: true, sortOrder: 20 },
  { label: "14 Tage", days: 14, isDefault: true, active: true, sortOrder: 30 },
  { label: "30 Tage", days: 30, isDefault: false, active: true, sortOrder: 40 }
]

const defaultReminders: ReminderPreparationForm[] = [
  { level: 1, label: "Freundliche Erinnerung", daysAfterDue: 7, active: false, templateNote: "Vorlage fuer erste Zahlungserinnerung vorbereitet." },
  { level: 2, label: "Mahnung", daysAfterDue: 14, active: false, templateNote: "Vorlage fuer Mahnstufe vorbereitet." },
  { level: 3, label: "Letzte Mahnung", daysAfterDue: 30, active: false, templateNote: "Vorlage fuer letzte Mahnstufe vorbereitet." }
]

const fallback: FinanceForm = {
  company: "Dream Ledger GmbH",
  taxNumber: "12/345/67890",
  vatId: "DE123456789",
  registerCourt: "Amtsgericht Charlottenburg HRB 12345",
  defaultPaymentNote: "Bitte ueberweisen Sie den Betrag innerhalb von 14 Tagen unter Angabe der Rechnungsnummer.",
  bankAccounts: [{
    id: "local-standard",
    bankName: "Koelner Sparkasse",
    accountHolder: "Dream Ledger GmbH",
    iban: "DE12 1005 0000 1234 5678 90",
    bic: "BELA DE BE XXX",
    isDefault: true,
    qrEnabled: true,
    active: true
  }],
  paymentMethods: defaultMethods,
  paymentProviderConfigs: [
    { provider: "paypal", apiKey: "", secretKey: "", webhookUrl: "/api/payments/webhooks/paypal", enabled: false },
    { provider: "stripe", apiKey: "", secretKey: "", webhookUrl: "/api/payments/webhooks/stripe", enabled: false },
    { provider: "finapi", apiKey: "", secretKey: "", webhookUrl: "/api/finance/open-banking/finapi/webhook", enabled: false }
  ],
  paymentTerms: defaultTerms,
  reminderPreparation: defaultReminders
}

function newAccount(): BankAccountForm {
  return {
    id: "new-" + Date.now(),
    bankName: "",
    accountHolder: "",
    iban: "",
    bic: "",
    isDefault: false,
    qrEnabled: true,
    active: true
  }
}

function normalizeAccount(account: Partial<BankAccountForm>, index: number): BankAccountForm {
  return {
    id: account.id || "account-" + index,
    bankName: account.bankName || "",
    accountHolder: account.accountHolder || "",
    iban: account.iban || "",
    bic: account.bic || "",
    isDefault: Boolean(account.isDefault),
    qrEnabled: account.qrEnabled !== false,
    active: account.active !== false
  }
}

export default function FinanceSettingsPage() {
  const { t } = useLanguage()
  const [form, setForm] = useState<FinanceForm>(fallback)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadSettings() {
      const [companyResponse, financeResponse] = await Promise.all([
        fetch("/api/settings/company", { cache: "no-store" }),
        fetch("/api/finance/base", { cache: "no-store" })
      ])
      const companyResult = await companyResponse.json().catch(() => ({}))
      const financeResult = await financeResponse.json().catch(() => ({}))
      const settings = companyResult.settings || financeResult.settings || {}
      const accounts = Array.isArray(financeResult.bankAccounts) && financeResult.bankAccounts.length
        ? financeResult.bankAccounts.map(normalizeAccount)
        : [{
            ...fallback.bankAccounts[0],
            bankName: settings.bankName || "",
            accountHolder: settings.company || fallback.company,
            iban: settings.iban || "",
            bic: settings.bic || ""
          }]

      setForm({
        company: settings.company || fallback.company,
        taxNumber: settings.taxNumber || "",
        vatId: settings.vatId || "",
        registerCourt: settings.registerCourt || "",
        defaultPaymentNote: settings.defaultPaymentNote || fallback.defaultPaymentNote,
        bankAccounts: accounts.some((account: BankAccountForm) => account.isDefault)
          ? accounts
          : accounts.map((account: BankAccountForm, index: number) => ({ ...account, isDefault: index === 0 })),
        paymentMethods: Array.isArray(financeResult.paymentMethods) && financeResult.paymentMethods.length ? financeResult.paymentMethods : defaultMethods,
        paymentProviderConfigs: Array.isArray(financeResult.paymentProviderConfigs) && financeResult.paymentProviderConfigs.length ? financeResult.paymentProviderConfigs : fallback.paymentProviderConfigs,
        paymentTerms: Array.isArray(financeResult.paymentTerms) && financeResult.paymentTerms.length ? financeResult.paymentTerms : defaultTerms,
        reminderPreparation: Array.isArray(financeResult.reminderPreparation) && financeResult.reminderPreparation.length ? financeResult.reminderPreparation : defaultReminders
      })
    }

    loadSettings().catch(() => setStatus(t("settings.finance.status.error")))
  }, [t])

  const defaultAccount = useMemo(() => form.bankAccounts.find((account) => account.isDefault) ?? form.bankAccounts[0], [form.bankAccounts])
  const defaultTerm = useMemo(() => form.paymentTerms.find((term) => term.isDefault) ?? form.paymentTerms[0], [form.paymentTerms])

  function update(field: keyof Omit<FinanceForm, "bankAccounts" | "paymentMethods" | "paymentTerms" | "reminderPreparation">, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateAccount(index: number, patch: Partial<BankAccountForm>) {
    setForm((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.map((account, accountIndex) => accountIndex === index ? { ...account, ...patch } : account)
    }))
  }

  function setDefaultAccount(index: number) {
    setForm((current) => ({
      ...current,
      bankAccounts: current.bankAccounts.map((account, accountIndex) => ({ ...account, isDefault: accountIndex === index }))
    }))
  }

  function removeAccount(index: number) {
    setForm((current) => {
      const nextAccounts = current.bankAccounts.filter((_, accountIndex) => accountIndex !== index)
      return {
        ...current,
        bankAccounts: nextAccounts.length
          ? nextAccounts.map((account, accountIndex) => ({ ...account, isDefault: account.isDefault || accountIndex === 0 }))
          : [newAccount()]
      }
    })
  }

  function updateMethod(index: number, enabled: boolean) {
    setForm((current) => ({
      ...current,
      paymentMethods: current.paymentMethods.map((method, methodIndex) => methodIndex === index ? { ...method, enabled } : method)
    }))
  }

  function updateProvider(index: number, patch: Partial<PaymentProviderForm>) {
    setForm((current) => ({
      ...current,
      paymentProviderConfigs: current.paymentProviderConfigs.map((provider, providerIndex) => providerIndex === index ? { ...provider, ...patch } : provider)
    }))
  }

  function updateTerm(index: number, patch: Partial<PaymentTermForm>) {
    setForm((current) => ({
      ...current,
      paymentTerms: current.paymentTerms.map((term, termIndex) => termIndex === index ? { ...term, ...patch } : term)
    }))
  }

  function setDefaultTerm(index: number) {
    setForm((current) => ({
      ...current,
      paymentTerms: current.paymentTerms.map((term, termIndex) => ({ ...term, isDefault: termIndex === index }))
    }))
  }

  async function save() {
    setStatus(t("settings.finance.status.saving"))
    const validAccounts = form.bankAccounts.filter((account) => account.iban.trim())

    if (!validAccounts.length) {
      setStatus("Mindestens ein Bankkonto mit IBAN ist erforderlich.")
      return
    }

    const existingResponse = await fetch("/api/settings/company", { cache: "no-store" })
    const existingResult = await existingResponse.json().catch(() => ({}))
    const existing = existingResult.settings || {}
    const selectedDefaultAccount = validAccounts.find((account) => account.isDefault) ?? validAccounts[0]
    const selectedDefaultTerm = form.paymentTerms.find((term) => term.isDefault) ?? defaultTerm

    const [companyResponse, financeResponse] = await Promise.all([
      fetch("/api/settings/company", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...existing,
          company: existing.company || form.company || fallback.company,
          bankName: selectedDefaultAccount.bankName,
          iban: selectedDefaultAccount.iban,
          bic: selectedDefaultAccount.bic,
          taxNumber: form.taxNumber,
          vatId: form.vatId,
          registerCourt: form.registerCourt,
          defaultPaymentTermsDays: Number(selectedDefaultTerm?.days ?? 14),
          defaultPaymentNote: form.defaultPaymentNote
        })
      }),
      fetch("/api/finance/base", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankAccounts: form.bankAccounts,
          paymentMethods: form.paymentMethods,
          paymentProviderConfigs: form.paymentProviderConfigs,
          paymentTerms: form.paymentTerms,
          reminderPreparation: form.reminderPreparation
        })
      })
    ])

    const companyResult = await companyResponse.json().catch(() => ({}))
    const financeResult = await financeResponse.json().catch(() => ({}))

    if (!companyResponse.ok || !companyResult.ok) {
      setStatus(companyResult.error || t("settings.finance.status.error"))
      return
    }

    if (!financeResponse.ok || !financeResult.ok) {
      setStatus(financeResult.error || t("settings.finance.status.error"))
      return
    }

    setForm((current) => ({
      ...current,
      bankAccounts: Array.isArray(financeResult.bankAccounts) && financeResult.bankAccounts.length ? financeResult.bankAccounts.map(normalizeAccount) : current.bankAccounts,
      paymentMethods: Array.isArray(financeResult.paymentMethods) && financeResult.paymentMethods.length ? financeResult.paymentMethods : current.paymentMethods,
      paymentProviderConfigs: Array.isArray(financeResult.paymentProviderConfigs) && financeResult.paymentProviderConfigs.length ? financeResult.paymentProviderConfigs : current.paymentProviderConfigs,
      paymentTerms: Array.isArray(financeResult.paymentTerms) && financeResult.paymentTerms.length ? financeResult.paymentTerms : current.paymentTerms,
      reminderPreparation: Array.isArray(financeResult.reminderPreparation) && financeResult.reminderPreparation.length ? financeResult.reminderPreparation : current.reminderPreparation
    }))
    setStatus(t("settings.finance.status.saved"))
  }

  return (
    <SettingsLayout
      title={t("settings.finance.title")}
      description={t("settings.finance.description")}
      action={save}
      status={status}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <SettingCard title="Bankkonten" description="Mehrere Konten pflegen und ein Standardkonto fuer neue Rechnungen festlegen.">
            <div className="space-y-4">
              {form.bankAccounts.map((account, index) => (
                <section key={account.id} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <button type="button" onClick={() => setDefaultAccount(index)} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-4 py-2 text-xs font-extrabold text-[var(--settings-title)]">
                      <span className={account.isDefault ? "h-3 w-3 rounded-full bg-[var(--settings-accent)]" : "h-3 w-3 rounded-full border border-[var(--settings-line)]"} />
                      Standardkonto
                    </button>
                    <div className="flex items-center gap-2">
                      <button type="button" onClick={() => updateAccount(index, { qrEnabled: !account.qrEnabled })} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-3 py-2 text-xs font-extrabold text-[var(--settings-muted)]"><QrCode className="h-4 w-4" />{account.qrEnabled ? "QR aktiv" : "QR aus"}</button>
                      <button type="button" onClick={() => removeAccount(index)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600"><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field label="Bankname"><SoftInput value={account.bankName} onChange={(event) => updateAccount(index, { bankName: event.target.value })} /></Field>
                    <Field label="Kontoinhaber"><SoftInput value={account.accountHolder} onChange={(event) => updateAccount(index, { accountHolder: event.target.value })} /></Field>
                    <Field label="IBAN"><SoftInput value={account.iban} onChange={(event) => updateAccount(index, { iban: event.target.value })} /></Field>
                    <Field label="BIC"><SoftInput value={account.bic} onChange={(event) => updateAccount(index, { bic: event.target.value })} /></Field>
                  </div>
                </section>
              ))}
              <button type="button" onClick={() => setForm((current) => ({ ...current, bankAccounts: [...current.bankAccounts, newAccount()] }))} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-accent-strong)] px-5 py-3 text-sm font-extrabold text-white">
                <Plus className="h-4 w-4" />Bankkonto anlegen
              </button>
            </div>
          </SettingCard>

          <SettingCard title="Zahlungsarten" description="Aktive Methoden steuern; PayPal und Stripe koennen fuer Online-Zahlungen aktiviert werden.">
            <div className="grid gap-3 sm:grid-cols-2">
              {form.paymentMethods.map((method, index) => (
                <button key={method.key} type="button" onClick={() => updateMethod(index, !method.enabled)} className="flex items-center justify-between gap-3 rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4 text-left">
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><CreditCard className="h-4 w-4" /></span>
                    <span><strong className="block text-sm font-extrabold text-[var(--settings-title)]">{method.label}</strong><small className="text-xs font-semibold text-[var(--settings-muted)]">{method.prepared ? "Vorbereitet" : "Aktiv nutzbar"}</small></span>
                  </span>
                  <span className={method.enabled ? "h-5 w-5 rounded-full bg-[var(--settings-accent)]" : "h-5 w-5 rounded-full border border-[var(--settings-line)]"} />
                </button>
              ))}
            </div>
          </SettingCard>

<SettingCard title="PayPal Konfiguration" description="API Key, Secret Key und Webhook URL fuer PayPal Checkout.">
            <div className="grid gap-4">
              {form.paymentProviderConfigs.filter((provider) => provider.provider === "paypal").map((provider) => {
                const index = form.paymentProviderConfigs.findIndex((item) => item.provider === provider.provider)
                return (
                  <section key={provider.provider} className="rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <strong className="text-sm font-extrabold text-[var(--settings-title)]">PayPal</strong>
                      <button type="button" onClick={() => updateProvider(index, { enabled: !provider.enabled })} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-3 py-2 text-xs font-extrabold text-[var(--settings-muted)]">
                        <span className={provider.enabled ? "h-3 w-3 rounded-full bg-[var(--settings-accent)]" : "h-3 w-3 rounded-full border border-[var(--settings-line)]"} />{provider.enabled ? "Aktiv" : "Inaktiv"}
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="API Key"><SoftInput value={provider.apiKey || ""} onChange={(event) => updateProvider(index, { apiKey: event.target.value })} /></Field>
                      <Field label="Secret Key"><SoftInput type="password" value={provider.secretKey || ""} onChange={(event) => updateProvider(index, { secretKey: event.target.value })} /></Field>
                      <Field label="Webhook URL"><SoftInput value={provider.webhookUrl || "/api/payments/webhooks/paypal"} onChange={(event) => updateProvider(index, { webhookUrl: event.target.value })} /></Field>
                    </div>
                  </section>
                )
              })}
            </div>
          </SettingCard>

          <SettingCard title="Stripe Konfiguration" description="API Key, Secret Key und Webhook URL fuer Stripe Checkout.">
            <div className="grid gap-4">
              {form.paymentProviderConfigs.filter((provider) => provider.provider === "stripe").map((provider) => {
                const index = form.paymentProviderConfigs.findIndex((item) => item.provider === provider.provider)
                return (
                  <section key={provider.provider} className="rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <strong className="text-sm font-extrabold text-[var(--settings-title)]">Stripe</strong>
                      <button type="button" onClick={() => updateProvider(index, { enabled: !provider.enabled })} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-3 py-2 text-xs font-extrabold text-[var(--settings-muted)]">
                        <span className={provider.enabled ? "h-3 w-3 rounded-full bg-[var(--settings-accent)]" : "h-3 w-3 rounded-full border border-[var(--settings-line)]"} />{provider.enabled ? "Aktiv" : "Inaktiv"}
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="API Key"><SoftInput value={provider.apiKey || ""} onChange={(event) => updateProvider(index, { apiKey: event.target.value })} /></Field>
                      <Field label="Secret Key"><SoftInput type="password" value={provider.secretKey || ""} onChange={(event) => updateProvider(index, { secretKey: event.target.value })} /></Field>
                      <Field label="Webhook URL"><SoftInput value={provider.webhookUrl || "/api/payments/webhooks/stripe"} onChange={(event) => updateProvider(index, { webhookUrl: event.target.value })} /></Field>
                    </div>
                  </section>
                )
              })}
            </div>
          </SettingCard>

          <SettingCard title="Open Banking" description="finAPI als Standardanbieter fuer Deutschland und EU vorbereiten. Keine echte Bankverbindung aktiv.">
            <div className="grid gap-4">
              {form.paymentProviderConfigs.filter((provider) => provider.provider === "finapi").map((provider) => {
                const index = form.paymentProviderConfigs.findIndex((item) => item.provider === provider.provider)
                return (
                  <section key={provider.provider} className="rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><Landmark className="h-4 w-4" /></span>
                        <div>
                          <strong className="block text-sm font-extrabold text-[var(--settings-title)]">finAPI</strong>
                          <small className="text-xs font-semibold text-[var(--settings-muted)]">PSD2 vorbereitet, keine Bank-Logins gespeichert</small>
                        </div>
                      </div>
                      <button type="button" onClick={() => updateProvider(index, { enabled: !provider.enabled })} className="inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-3 py-2 text-xs font-extrabold text-[var(--settings-muted)]">
                        <span className={provider.enabled ? "h-3 w-3 rounded-full bg-[var(--settings-accent)]" : "h-3 w-3 rounded-full border border-[var(--settings-line)]"} />{provider.enabled ? "Vorbereitet" : "Inaktiv"}
                      </button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="finAPI Client ID"><SoftInput value={provider.apiKey || ""} onChange={(event) => updateProvider(index, { apiKey: event.target.value })} placeholder="Noch keine echten Zugangsdaten" /></Field>
                      <Field label="finAPI Secret"><SoftInput type="password" value={provider.secretKey || ""} onChange={(event) => updateProvider(index, { secretKey: event.target.value })} placeholder="Verschluesselte Speicherung vorbereitet" /></Field>
                      <Field label="Webhook URL"><SoftInput value={provider.webhookUrl || "/api/finance/open-banking/finapi/webhook"} onChange={(event) => updateProvider(index, { webhookUrl: event.target.value })} /></Field>
                    </div>
                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
                      {[
                        { icon: LockKeyhole, label: "Token-Verwaltung", value: "Vorbereitet" },
                        { icon: ShieldCheck, label: "Audit Log", value: "Aktiv vorgesehen" },
                        { icon: RefreshCw, label: "Synchronisation", value: "Deaktiviert" }
                      ].map((item) => {
                        const Icon = item.icon
                        return (
                          <div key={item.label} className="rounded-[18px] border border-[var(--settings-line)] bg-[var(--settings-surface)] p-3">
                            <div className="flex items-center gap-2 text-[var(--settings-title)]"><Icon className="h-4 w-4" /><span className="text-xs font-extrabold">{item.label}</span></div>
                            <p className="mt-1 text-xs font-semibold text-[var(--settings-muted)]">{item.value}</p>
                          </div>
                        )
                      })}
                    </div>
                  </section>
                )
              })}
            </div>
          </SettingCard>

          <SettingCard title="Zahlungsziele" description="Standard-Zahlungsziel fuer neue Rechnungen und spaetere Kundenpraeferenzen.">
            <div className="grid gap-3 sm:grid-cols-2">
              {form.paymentTerms.map((term, index) => (
                <section key={term.label + index} className="rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                  <button type="button" onClick={() => setDefaultTerm(index)} className="mb-3 inline-flex items-center gap-2 rounded-full bg-[var(--settings-surface)] px-3 py-2 text-xs font-extrabold text-[var(--settings-title)]">
                    <span className={term.isDefault ? "h-3 w-3 rounded-full bg-[var(--settings-accent)]" : "h-3 w-3 rounded-full border border-[var(--settings-line)]"} />Standard
                  </button>
                  <div className="grid gap-3">
                    <Field label="Bezeichnung"><SoftInput value={term.label} onChange={(event) => updateTerm(index, { label: event.target.value })} /></Field>
                    <Field label="Tage"><SoftInput type="number" min="0" value={term.days} onChange={(event) => updateTerm(index, { days: Number.parseInt(event.target.value || "0", 10) })} /></Field>
                  </div>
                </section>
              ))}
            </div>
          </SettingCard>
        </div>

        <div className="space-y-6">
          <SettingCard title="QR-Zahlung" description="SEPA-QR wird aus dem Standardkonto vorbereitet; es wird keine externe API verwendet.">
            <div className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><QrCode className="h-5 w-5" /></span>
                <div>
                  <strong className="block text-sm font-extrabold text-[var(--settings-title)]">{defaultAccount?.qrEnabled ? "Automatisch erzeugbar" : "Deaktiviert"}</strong>
                  <p className="mt-2 text-sm font-medium leading-6 text-[var(--settings-muted)]">{defaultAccount?.iban || "IBAN fehlt"} wird fuer neue Rechnungen als QR-Basis gespeichert.</p>
                </div>
              </div>
            </div>
          </SettingCard>

          <SettingCard title="Steuern und Register" description="Pflichtangaben fuer Rechnungen, Footer und offizielle Dokumente verwalten.">
            <div className="grid gap-4">
              <Field label={t("settings.finance.fields.taxNumber")}><SoftInput value={form.taxNumber} onChange={(event) => update("taxNumber", event.target.value)} /></Field>
              <Field label={t("settings.finance.fields.vatId")}><SoftInput value={form.vatId} onChange={(event) => update("vatId", event.target.value)} /></Field>
              <Field label={t("settings.finance.fields.registerCourt")}><SoftInput value={form.registerCourt} onChange={(event) => update("registerCourt", event.target.value)} /></Field>
              <Field label="Zahlungshinweis"><SoftTextarea rows={5} value={form.defaultPaymentNote} onChange={(event) => update("defaultPaymentNote", event.target.value)} /></Field>
            </div>
          </SettingCard>

          <SettingCard title="Mahnwesen Vorbereitung" description="Mahnstufen als Struktur vorbereiten; es werden keine automatischen Mahnungen versendet.">
            <div className="space-y-3">
              {form.reminderPreparation.map((item) => (
                <div key={item.level} className="rounded-[20px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><AlertCircle className="h-4 w-4" /></span>
                      <span><strong className="block text-sm font-extrabold text-[var(--settings-title)]">{item.label}</strong><small className="text-xs font-semibold text-[var(--settings-muted)]">{item.daysAfterDue} Tage nach Faelligkeit</small></span>
                    </span>
                    <span className="rounded-full bg-[var(--settings-surface)] px-3 py-1 text-[11px] font-extrabold text-[var(--settings-muted)]">Vorbereitet</span>
                  </div>
                </div>
              ))}
            </div>
          </SettingCard>

          <SettingCard title="Schnellueberblick" description="Die wichtigsten Finanz- und Pflichtangaben des Moduls auf einen Blick.">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { icon: Landmark, label: "Bankkonten", value: String(form.bankAccounts.length) },
                { icon: BadgeEuro, label: "Standardkonto", value: defaultAccount?.bankName || "Nicht gesetzt" },
                { icon: CalendarDays, label: "Zahlungsziel", value: String(defaultTerm?.days ?? 14) + " Tage" },
                { icon: ScrollText, label: "Mahnwesen", value: "Vorbereitet" },
                { icon: Landmark, label: "Open Banking", value: "finAPI vorbereitet" }
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="rounded-[22px] border border-[var(--settings-line)] bg-[var(--settings-subtle)] px-4 py-3">
                    <div className="flex items-center gap-3 text-[var(--settings-title)]">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--settings-accent-soft)] text-[var(--settings-accent)]"><Icon className="h-4 w-4" /></span>
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-widest text-[var(--settings-label)]">{item.label}</p>
                        <p className="mt-1 text-sm font-semibold text-[var(--settings-title)]">{item.value}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </SettingCard>
        </div>
      </div>
    </SettingsLayout>
  )
}
