"use client"

import { useEffect, useMemo, useState, type ComponentType } from "react"
import Link from "next/link"
import {
  Archive,
  BarChart3,
  Building2,
  Code2,
  FileText,
  Globe,
  Landmark,
  Mail,
  Palette,
  Puzzle,
  ScrollText,
  Settings,
  TerminalSquare,
  Users
} from "lucide-react"

import { type PremiumSettingsSection } from "./sectionMap"
import styles from "./PremiumSettingsSectionContent.module.css"

type SettingsIcon = ComponentType<{ size?: number; className?: string }>

type SettingsCategory = {
  icon: SettingsIcon
  description: string
  items: string[]
}

type SettingsValues = Record<string, Record<string, string>>

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

const DEV_CARDS = [
  {
    title: "Berichte",
    description: "Analysen, Statistiken und Auswertungen oeffnen.",
    icon: BarChart3,
    href: "/dashboard-v2/reports"
  },
  {
    title: "Logs",
    description: "Logs und Ereignisse detailliert anzeigen.",
    icon: ScrollText,
    href: "/dashboard-v2/logs"
  }
]

const LICENSE_BILLING_CARDS = [
  {
    title: "Lizenz & Abrechnung",
    description: "Plan, Marketplace und Abrechnung oeffnen.",
    icon: Puzzle,
    href: "/dashboard-v2/license-billing"
  }
]

const defaultPaymentMethods: PaymentMethodForm[] = [
  { key: "bank_transfer", label: "Ueberweisung", enabled: true, prepared: false, sortOrder: 10 },
  { key: "cash", label: "Bar", enabled: true, prepared: false, sortOrder: 20 },
  { key: "ec_card", label: "EC-Karte", enabled: true, prepared: false, sortOrder: 30 },
  { key: "credit_card", label: "Kreditkarte", enabled: true, prepared: false, sortOrder: 40 },
  { key: "paypal", label: "PayPal", enabled: false, prepared: true, sortOrder: 50 },
  { key: "stripe", label: "Stripe", enabled: false, prepared: true, sortOrder: 60 },
  { key: "finapi", label: "finAPI Open Banking", enabled: false, prepared: true, sortOrder: 70 }
]

const defaultPaymentTerms: PaymentTermForm[] = [
  { label: "Sofort faellig", days: 0, isDefault: false, active: true, sortOrder: 10 },
  { label: "7 Tage", days: 7, isDefault: false, active: true, sortOrder: 20 },
  { label: "14 Tage", days: 14, isDefault: true, active: true, sortOrder: 30 },
  { label: "30 Tage", days: 30, isDefault: false, active: true, sortOrder: 40 }
]

const defaultReminderPreparation: ReminderPreparationForm[] = [
  { level: 1, label: "Freundliche Erinnerung", daysAfterDue: 7, active: false, templateNote: "Vorlage fuer erste Zahlungserinnerung vorbereitet." },
  { level: 2, label: "Mahnung", daysAfterDue: 14, active: false, templateNote: "Vorlage fuer Mahnstufe vorbereitet." },
  { level: 3, label: "Letzte Mahnung", daysAfterDue: 30, active: false, templateNote: "Vorlage fuer letzte Mahnung vorbereitet." }
]

const fallbackFinanceForm: FinanceForm = {
  company: "DreamInvoice",
  taxNumber: "",
  vatId: "",
  registerCourt: "",
  defaultPaymentNote: "",
  bankAccounts: [{
    id: "standard-bank",
    bankName: "",
    accountHolder: "",
    iban: "",
    bic: "",
    isDefault: true,
    qrEnabled: true,
    active: true
  }],
  paymentMethods: defaultPaymentMethods,
  paymentProviderConfigs: [
    { provider: "paypal", apiKey: "", secretKey: "", webhookUrl: "/api/payments/webhooks/paypal", enabled: false },
    { provider: "stripe", apiKey: "", secretKey: "", webhookUrl: "/api/payments/webhooks/stripe", enabled: false },
    { provider: "finapi", apiKey: "", secretKey: "", webhookUrl: "/api/finance/open-banking/finapi/webhook", enabled: false }
  ],
  paymentTerms: defaultPaymentTerms,
  reminderPreparation: defaultReminderPreparation
}

const SETTINGS: Record<string, SettingsCategory> = {
  Unternehmen: {
    icon: Building2,
    description: "Verwalten Sie alle Unternehmensdaten",
    items: ["Firmendaten", "Adresse", "Kontakt", "Stammdaten"]
  },
  User: {
    icon: Users,
    description: "Benutzer, Rollen, Rechte und Sicherheit verwalten",
    items: ["User", "Rollen", "Rechte", "2FA", "Sitzungen"]
  },
  Branding: {
    icon: Palette,
    description: "Logo, Farben und Dokumentauftritt verwalten",
    items: ["Logo", "Farben", "Dokumentauftritt"]
  },
  Finanzen: {
    icon: Landmark,
    description: "Bankdaten, Steuerdaten und Zahlungsanbieter verwalten",
    items: ["Bankdaten", "Steuerdaten", "Zahlungsbasis", "PayPal"]
  },
  Dokumente: {
    icon: FileText,
    description: "Dokumenttypen, Vorlagen und Nummernkreise verwalten",
    items: ["Dokumenttypen", "Vorlagen", "Nummernkreise", "Export", "Import"]
  },
  "E-Mail": {
    icon: Mail,
    description: "E-Mail-Anbieter, SMTP und Mailserver verwalten",
    items: ["E-Mail-Anbieter", "SMTP", "Eigener Mail-Server"]
  },
  Portal: {
    icon: Globe,
    description: "Portal, Paperless, Nextcloud und Google Drive verwalten",
    items: ["Portal Base URL", "Publish API Key", "Paperless-ngx", "Nextcloud", "Google Drive"]
  },
  "API / Webhooks": {
    icon: Code2,
    description: "API-Zugaenge, Keys, Webhooks und Limits verwalten",
    items: ["API", "Webhooks", "Kategorien", "API-Zugang", "API Keys", "Berechtigungen", "Limits"]
  },
  "Lizenz & Abrechnung": {
    icon: Puzzle,
    description: "Plan, Marketplace und Abrechnung verwalten",
    items: ["Lizenz & Abrechnung"]
  },
  Archiv: {
    icon: Archive,
    description: "Archivdaten exportieren, importieren und archivieren",
    items: ["Export", "Import", "Archivieren"]
  },
  System: {
    icon: Settings,
    description: "Backup, Restore und Systemexport verwalten",
    items: ["Backup erstellen", "Restore", "Export CSV"]
  },
  Dev: {
    icon: TerminalSquare,
    description: "Berichte und Logs anzeigen",
    items: ["Berichte", "Logs"]
  }
}

const FIELD_DEFINITIONS: Record<string, string[]> = {
  "Unternehmen/Firmendaten": ["Firmenname", "Rechtsform", "USt-ID", "Steuernummer", "Handelsregister"],
  "Unternehmen/Adresse": ["Strasse", "Hausnummer", "PLZ", "Ort", "Land"],
  "Unternehmen/Kontakt": ["Telefon", "Mobil", "E-Mail", "Webseite"],
  "Unternehmen/Stammdaten": ["Sprache", "Waehrung", "Zeitzone"],
  "User/User": ["Name", "E-Mail", "Rolle"],
  "User/Rollen": ["Rollenname", "Beschreibung"],
  "User/Rechte": ["Rechtegruppe", "Berechtigung"],
  "User/2FA": ["Methode", "Backup-Codes"],
  "User/Sitzungen": ["Session Timeout", "Max. Sitzungen"],
  "Branding/Logo": ["Logo Upload", "Favicon Upload"],
  "Branding/Farben": ["Primaerfarbe", "Sekundaerfarbe", "Akzentfarbe"],
  "Branding/Dokumentauftritt": ["Briefkopf", "Fusszeile", "Dokumentstil"],
  "Finanzen/Bankdaten": ["Kontoinhaber", "IBAN", "BIC", "Bankname"],
  "Finanzen/Steuerdaten": ["Steuernummer", "USt-ID", "Registergericht", "Zahlungshinweis"],
  "Finanzen/Zahlungsbasis": ["Standard-Zahlungsziel", "Erste Mahnung nach Tagen", "Bankueberweisung aktiv", "PayPal Zahlungsart aktiv"],
  "Finanzen/PayPal": ["Client ID", "Secret", "Webhook URL", "Aktiv"],
  "Dokumente/Dokumenttypen": ["Typ Name", "Beschreibung"],
  "Dokumente/Vorlagen": ["Vorlagenname", "Dokumenttyp"],
  "Dokumente/Nummernkreise": ["Rechnungsnummer", "Angebotsnummer", "Kundennummer", "Projekt Nummer"],
  "Dokumente/Export": ["Export Format", "Ziel"],
  "Dokumente/Import": ["Import Format", "Quelle"],
  "API / Webhooks/API": ["Basis URL", "Version"],
  "API / Webhooks/Webhooks": ["Webhook URL", "Event"],
  "API / Webhooks/Kategorien": ["Kategorie Name", "Beschreibung"],
  "API / Webhooks/API-Zugang": ["Token Laufzeit"],
  "API / Webhooks/API Keys": ["API Key Name", "Key", "Ablaufdatum"],
  "API / Webhooks/Berechtigungen": ["Berechtigungsgruppe", "Zugriff"],
  "API / Webhooks/Limits": ["Rate Limit", "Requests pro Minute"],
  "System/Backup erstellen": ["Backup Name", "Backup Typ"],
  "System/Restore": ["Restore Datei", "Restore Modus"],
  "System/Export CSV": ["CSV Bereich", "Trennzeichen", "Export Ziel"],
  "Dev/Berichte": ["Bericht Name", "Zeitraum"],
  "Dev/Logs": ["Log Typ", "Zeitraum", "Level"],
  "Archiv/Export": ["Export Bereich", "Format"],
  "Archiv/Import": ["Import Datei", "Import Modus"],
  "Archiv/Archivieren": ["Archiv Name", "Zeitraum"],
  "E-Mail/E-Mail-Anbieter": ["Anbieter", "Absender E-Mail"],
  "E-Mail/SMTP": ["SMTP Host", "SMTP Port", "Benutzername", "Passwort", "Verschluesselung"],
  "E-Mail/Eigener Mail-Server": ["Server URL", "Benutzer", "Passwort"],
  "Portal/Portal Base URL": ["Portal URL"],
  "Portal/Publish API Key": ["Key Name", "Publish API Key"],
  "Portal/Paperless-ngx": ["Paperless URL", "Token"],
  "Portal/Nextcloud": ["Nextcloud URL", "Benutzer", "Passwort/App Token"],
  "Portal/Google Drive": ["Client ID", "Client Secret"]
}

const sectionToCategory: Partial<Record<PremiumSettingsSection, string>> = {
  company: "Unternehmen",
  users: "User",
  branding: "Branding",
  finance: "Finanzen",
  documents: "Dokumente",
  api: "API / Webhooks",
  webhooks: "API / Webhooks",
  system: "System",
  dev: "Dev",
  "license-billing": "Lizenz & Abrechnung",
  archive: "Archiv",
  email: "E-Mail",
  portal: "Portal"
}

export function PremiumSettingsSectionContent({ section = "company" }: { section?: PremiumSettingsSection | null }) {
  const initialCategory = section ? sectionToCategory[section] ?? "Unternehmen" : "Unternehmen"
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeSubcategory, setActiveSubcategory] = useState(SETTINGS[initialCategory].items[0])
  const [settingsValues, setSettingsValues] = useState<SettingsValues>({})
  const [financeForm, setFinanceForm] = useState<FinanceForm>(fallbackFinanceForm)
  const [loadedFinanceForm, setLoadedFinanceForm] = useState<FinanceForm>(fallbackFinanceForm)
  const [financeLoaded, setFinanceLoaded] = useState(false)
  const [financeLoading, setFinanceLoading] = useState(false)
  const [financeSaving, setFinanceSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState("")

  const current = SETTINGS[activeCategory]
  const CategoryIcon = current.icon
  const isDevCategory = activeCategory === "Dev"
  const isLicenseBillingCategory = activeCategory === "Lizenz & Abrechnung"
  const formKey = `${activeCategory}/${activeSubcategory}`
  const fields = (FIELD_DEFINITIONS[formKey] ?? ["Name", "Beschreibung"]).filter((field) => field !== "Status")
  const defaultFinanceAccount = useMemo(() => {
    return financeForm.bankAccounts.find((account) => account.isDefault) ?? financeForm.bankAccounts[0] ?? fallbackFinanceForm.bankAccounts[0]
  }, [financeForm.bankAccounts])
  const defaultFinanceTerm = useMemo(() => {
    return financeForm.paymentTerms.find((term) => term.isDefault) ?? financeForm.paymentTerms[0] ?? defaultPaymentTerms[2]
  }, [financeForm.paymentTerms])

  useEffect(() => {
    if (activeCategory !== "Finanzen" || financeLoaded || financeLoading) return
    void loadFinanceSettings()
  }, [activeCategory, financeLoaded, financeLoading])

  function selectCategory(category: string) {
    setActiveCategory(category)
    setActiveSubcategory(SETTINGS[category].items[0])
    setSaveMessage("")
  }

  function handleChange(field: string, value: string) {
    if (activeCategory === "Finanzen") {
      updateFinanceField(activeSubcategory, field, value)
      return
    }

    setSettingsValues((currentValues) => ({
      ...currentValues,
      [formKey]: {
        ...(currentValues[formKey] ?? {}),
        [field]: value
      }
    }))
  }

  async function handleSave() {
    if (activeCategory === "Finanzen") {
      await saveFinanceSettings()
      return
    }

    setSaveMessage(`${formKey} wurde gespeichert.`)
  }

  function handleReset() {
    if (activeCategory === "Finanzen") {
      setFinanceForm(loadedFinanceForm)
      setSaveMessage(`${formKey} wurde auf die zuletzt geladenen Daten zurueckgesetzt.`)
      return
    }

    setSettingsValues((currentValues) => ({
      ...currentValues,
      [formKey]: {}
    }))
    setSaveMessage(`${formKey} wurde zurueckgesetzt.`)
  }

  function handleConnectionTest() {
    if (activeCategory === "Finanzen" && activeSubcategory === "PayPal") {
      void testPayPalConfiguration()
      return
    }

    setSaveMessage(`Verbindungstest fuer ${formKey} abgeschlossen.`)
  }

  return (
    <div className={styles.settingsPage}>
      <div className={styles.settingsHeader}>
        <h1>Einstellungen</h1>
        <p>Verwalten Sie alle Einstellungen Ihres Unternehmens</p>
      </div>

      <div className={styles.settingsLayout}>
        <main className={styles.settingsMain}>
          <section className={styles.settingsCategoryHead}>
            <div className={styles.settingsCategoryIcon}>
              <CategoryIcon size={28} />
            </div>

            <div>
              <h2>{activeCategory}</h2>
              <p>{current.description}</p>
            </div>
          </section>

          {isDevCategory || isLicenseBillingCategory ? (
            <section className={styles.settingsCardGrid}>
              {(isDevCategory ? DEV_CARDS : LICENSE_BILLING_CARDS).map((card) => {
                const Icon = card.icon

                return (
                  <Link key={card.title} href={card.href} className={styles.settingsCard}>

                    <div className={styles.settingsCardIcon}>
                      <Icon size={34} />
                    </div>

                    <h3>{card.title}</h3>
                    <p>{card.description}</p>
                  </Link>
                )
              })}
            </section>
          ) : (
            <>
              <section className={styles.settingsCardGrid}>
                {current.items.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`${styles.settingsCard} ${activeSubcategory === item ? styles.active : ""}`}
                    onClick={() => setActiveSubcategory(item)}
                  >

                    <div className={styles.settingsCardIcon}>
                      <CategoryIcon size={34} />
                    </div>

                    <h3>{item}</h3>
                    <p>{getDescription(activeCategory, item)}</p>
                  </button>
                ))}
              </section>

              <section className={styles.settingsFormCard}>
                <div className={styles.settingsFormHeader}>
                  <div>
                    <h2>{activeCategory} / {activeSubcategory}</h2>
                    <p>Hier koennen die Daten fuer diese Unterkategorie eingetragen und bearbeitet werden.</p>
                  </div>
                </div>

                <div className={styles.settingsFormGrid}>
                  {fields.map((field) => (
                    <label key={field} className={styles.settingsField}>
                      <span>{field}</span>
                      {renderField({
                        field,
                        value: activeCategory === "Finanzen" ? financeValue(activeSubcategory, field, financeForm) : settingsValues[formKey]?.[field] ?? "",
                        onChange: (value) => handleChange(field, value)
                      })}
                    </label>
                  ))}
                </div>

                <div className={styles.settingsFormActions}>
                  <button type="button" className={styles.btnPrimary} onClick={handleSave} disabled={financeSaving || financeLoading}>
                    {financeSaving ? "Speichert..." : "Speichern"}
                  </button>
                  <button type="button" className={styles.btnSecondary} onClick={handleReset} disabled={financeSaving || financeLoading}>Zuruecksetzen</button>
                  {shouldShowTestButton(activeSubcategory) ? (
                    <button type="button" className={styles.btnSecondary} onClick={handleConnectionTest} disabled={financeSaving || financeLoading}>
                      Verbindung testen
                    </button>
                  ) : null}
                </div>

                {saveMessage ? <p className={styles.settingsSaveMessage}>{saveMessage}</p> : null}
              </section>
            </>
          )}

          <section className={styles.settingsInfoBox}>
            <div className={styles.settingsInfoIcon}>i</div>
            <div>
              <h3>Ueber das {activeCategory}-Modul</h3>
              <p>
                Hier verwalten Sie alle grundlegenden Informationen zum Bereich {activeCategory}.
                Halten Sie diese Daten stets aktuell, um eine korrekte Abwicklung in allen Bereichen zu gewaehrleisten.
              </p>
            </div>
          </section>
        </main>

        <aside className={styles.settingsModulePanel}>
          <h3>Module</h3>

          {Object.entries(SETTINGS).map(([category, value]) => {
            const Icon = value.icon

            return (
              <button
                key={category}
                type="button"
                className={`${styles.moduleRow} ${activeCategory === category ? styles.active : ""}`}
                onClick={() => selectCategory(category)}
              >
                <span>
                  <Icon size={18} />
                  {category}
                </span>
                <strong>
                  <i />
                </strong>
              </button>
            )
          })}

          <div className={styles.systemHealth}>
            <span className={styles.systemHealthDot} aria-hidden="true" />
            <div>
              <h4>System</h4>
              <p>Alle Systeme laufen einwandfrei.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )

  async function loadFinanceSettings() {
    setFinanceLoading(true)
    setSaveMessage("Finanzdaten werden aus Datenbank und API geladen...")

    try {
      const [companyResponse, financeResponse] = await Promise.all([
        fetch("/api/settings/company", { cache: "no-store" }),
        fetch("/api/finance/base", { cache: "no-store" })
      ])
      const companyResult = await companyResponse.json().catch(() => ({}))
      const financeResult = await financeResponse.json().catch(() => ({}))

      if (!companyResponse.ok || !financeResponse.ok || companyResult.ok === false || financeResult.ok === false) {
        setSaveMessage(companyResult.error || financeResult.error || "Finanzdaten konnten nicht geladen werden.")
        return
      }

      const settings = companyResult.settings || financeResult.settings || {}
      const nextForm = normalizeFinanceForm(settings, financeResult)
      setFinanceForm(nextForm)
      setLoadedFinanceForm(nextForm)
      setFinanceLoaded(true)
      setSaveMessage("Finanzdaten wurden aus der Datenbank geladen.")
    } catch {
      setSaveMessage("Finanzdaten konnten nicht geladen werden.")
    } finally {
      setFinanceLoading(false)
    }
  }

  async function saveFinanceSettings() {
    setFinanceSaving(true)
    setSaveMessage("Finanzdaten werden gespeichert...")

    try {
      const validAccounts = financeForm.bankAccounts.filter((account) => account.iban.trim())
      if (!validAccounts.length) {
        setSaveMessage("Mindestens ein Bankkonto mit IBAN ist erforderlich.")
        return
      }

      const existingResponse = await fetch("/api/settings/company", { cache: "no-store" })
      const existingResult = await existingResponse.json().catch(() => ({}))
      const existing = existingResult.settings || {}
      const selectedDefaultAccount = validAccounts.find((account) => account.isDefault) ?? validAccounts[0]
      const selectedDefaultTerm = financeForm.paymentTerms.find((term) => term.isDefault) ?? defaultFinanceTerm

      const [companyResponse, financeResponse] = await Promise.all([
        fetch("/api/settings/company", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...existing,
            company: existing.company || financeForm.company || fallbackFinanceForm.company,
            bankName: selectedDefaultAccount.bankName,
            iban: selectedDefaultAccount.iban,
            bic: selectedDefaultAccount.bic,
            taxNumber: financeForm.taxNumber,
            vatId: financeForm.vatId,
            registerCourt: financeForm.registerCourt,
            defaultPaymentTermsDays: Number(selectedDefaultTerm?.days ?? 14),
            defaultPaymentNote: financeForm.defaultPaymentNote
          })
        }),
        fetch("/api/finance/base", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankAccounts: financeForm.bankAccounts,
            paymentMethods: financeForm.paymentMethods,
            paymentProviderConfigs: financeForm.paymentProviderConfigs,
            paymentTerms: financeForm.paymentTerms,
            reminderPreparation: financeForm.reminderPreparation
          })
        })
      ])

      const companyResult = await companyResponse.json().catch(() => ({}))
      const financeResult = await financeResponse.json().catch(() => ({}))

      if (!companyResponse.ok || companyResult.ok === false) {
        setSaveMessage(companyResult.error || "Firmendaten konnten nicht gespeichert werden.")
        return
      }

      if (!financeResponse.ok || financeResult.ok === false) {
        setSaveMessage(financeResult.error || "Finanzdaten konnten nicht gespeichert werden.")
        return
      }

      const nextForm = normalizeFinanceForm(companyResult.settings || financeResult.settings || {}, financeResult)
      setFinanceForm(nextForm)
      setLoadedFinanceForm(nextForm)
      setFinanceLoaded(true)
      setSaveMessage("Finanzdaten wurden in Datenbank und API gespeichert.")
    } catch {
      setSaveMessage("Finanzdaten konnten nicht gespeichert werden.")
    } finally {
      setFinanceSaving(false)
    }
  }

  async function testPayPalConfiguration() {
    setSaveMessage("PayPal-Konfiguration wird gegen die gespeicherten API-Daten geprueft...")

    try {
      const response = await fetch("/api/finance/base", { cache: "no-store" })
      const result = await response.json().catch(() => ({}))
      if (!response.ok || result.ok === false) {
        setSaveMessage(result.error || "PayPal-Konfiguration konnte nicht geladen werden.")
        return
      }

      const paypal = Array.isArray(result.paymentProviderConfigs)
        ? result.paymentProviderConfigs.find((provider: Partial<PaymentProviderForm>) => provider.provider === "paypal")
        : null

      if (!paypal) {
        setSaveMessage("PayPal ist in der Datenbank noch nicht als Zahlungsanbieter angelegt.")
        return
      }

      if (!paypal.apiKey || !paypal.secretKey) {
        setSaveMessage("PayPal API-Daten sind noch nicht vollstaendig gespeichert.")
        return
      }

      setSaveMessage(paypal.enabled ? "PayPal API-Daten sind gespeichert und der Anbieter ist aktiv." : "PayPal API-Daten sind gespeichert; der Anbieter ist aktuell deaktiviert.")
    } catch {
      setSaveMessage("PayPal-Konfiguration konnte nicht geprueft werden.")
    }
  }

  function updateFinanceField(subcategory: string, field: string, value: string) {
    setFinanceForm((current) => {
      if (subcategory === "Bankdaten") {
        const accounts = current.bankAccounts.length ? current.bankAccounts : fallbackFinanceForm.bankAccounts
        return {
          ...current,
          bankAccounts: accounts.map((account, index) => index === 0 ? updateFinanceAccountField(account, field, value, current.company) : account)
        }
      }

      if (subcategory === "Steuerdaten") {
        return {
          ...current,
          taxNumber: field === "Steuernummer" ? value : current.taxNumber,
          vatId: field === "USt-ID" ? value : current.vatId,
          registerCourt: field === "Registergericht" ? value : current.registerCourt,
          defaultPaymentNote: field === "Zahlungshinweis" ? value : current.defaultPaymentNote
        }
      }

      if (subcategory === "Zahlungsbasis") {
        const paymentTerms = current.paymentTerms.length ? current.paymentTerms : defaultPaymentTerms
        const reminderPreparation = current.reminderPreparation.length ? current.reminderPreparation : defaultReminderPreparation
        const paymentMethods = current.paymentMethods.length ? current.paymentMethods : defaultPaymentMethods

        return {
          ...current,
          paymentTerms: field === "Standard-Zahlungsziel"
            ? paymentTerms.map((term, index) => index === 0 ? { ...term, label: `${Number.parseInt(value || "0", 10) || 0} Tage`, days: Math.max(0, Number.parseInt(value || "0", 10) || 0), isDefault: true } : { ...term, isDefault: false })
            : paymentTerms,
          reminderPreparation: field === "Erste Mahnung nach Tagen"
            ? reminderPreparation.map((item, index) => index === 0 ? { ...item, daysAfterDue: Math.max(0, Number.parseInt(value || "0", 10) || 0) } : item)
            : reminderPreparation,
          paymentMethods: field === "Bankueberweisung aktiv" || field === "PayPal Zahlungsart aktiv"
            ? paymentMethods.map((method) => {
                if (field === "Bankueberweisung aktiv" && method.key === "bank_transfer") return { ...method, enabled: value === "true" }
                if (field === "PayPal Zahlungsart aktiv" && method.key === "paypal") return { ...method, enabled: value === "true" }
                return method
              })
            : paymentMethods
        }
      }

      if (subcategory === "PayPal") {
        return {
          ...current,
          paymentProviderConfigs: ensureProviderConfigs(current.paymentProviderConfigs).map((provider) => {
            if (provider.provider !== "paypal") return provider
            return {
              ...provider,
              apiKey: field === "Client ID" ? value : provider.apiKey,
              secretKey: field === "Secret" ? value : provider.secretKey,
              webhookUrl: field === "Webhook URL" ? value : provider.webhookUrl,
              enabled: field === "Aktiv" ? value === "true" : provider.enabled
            }
          })
        }
      }

      return current
    })
  }
}

function renderField({ field, value, onChange }: { field: string; value: string; onChange: (value: string) => void }) {
  if (field === "Aktiv" || field.endsWith(" aktiv")) {
    return (
      <select value={value || "false"} onChange={(event) => onChange(event.target.value)}>
        <option value="true">Aktiv</option>
        <option value="false">Inaktiv</option>
      </select>
    )
  }

  if (isPasswordField(field)) {
    return (
      <input
        type="password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={`${field} eingeben`}
      />
    )
  }

  if (isFileField(field)) {
    return (
      <input
        type="file"
        onChange={(event) => onChange(event.target.files?.[0]?.name ?? "")}
      />
    )
  }

  return (
    <input
      type={field.includes("Tagen") || field.includes("Zahlungsziel") ? "number" : "text"}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={`${field} eingeben`}
    />
  )
}

function getDescription(category: string, item: string) {
  const descriptions: Record<string, string> = {
    Firmendaten: "Verwalten Sie die grundlegenden Firmendaten Ihres Unternehmens.",
    Adresse: "Verwalten Sie die Adressdaten und Standorte Ihres Unternehmens.",
    Kontakt: "Verwalten Sie Kontaktinformationen und Kommunikationsdaten.",
    Stammdaten: "Verwalten Sie Stammdaten wie Waehrung, Sprache und Zeitzone.",
    "API-Zugang": "Verwalten Sie den Zugang zu Ihrer API und deren Einstellungen.",
    "API Keys": "Erstellen und verwalten Sie Ihre API-Schluessel und Tokens.",
    Berechtigungen: "Verwalten Sie Berechtigungen und Zugriffsrechte fuer API und System.",
    Limits: "Legen Sie Limits und Nutzungsbeschraenkungen fuer Ihre API fest.",
    SMTP: "Konfigurieren Sie SMTP-Zugang und E-Mail-Versand.",
    Nextcloud: "Verbinden Sie DreamInvoice mit Ihrer Nextcloud.",
    PayPal: "Konfigurieren Sie PayPal-Zahlungen und Sandbox-Modus."
  }

  return descriptions[item] ?? `${item} im Bereich ${category} verwalten.`
}


function isPasswordField(field: string) {
  const normalized = field.toLowerCase()
  return normalized.includes("passwort") || normalized.includes("secret") || normalized.includes("token") || normalized.includes("key")
}

function isFileField(field: string) {
  const normalized = field.toLowerCase()
  return normalized.includes("upload") || normalized.includes("datei")
}

function shouldShowTestButton(subcategory: string) {
  return ["SMTP", "PayPal", "Nextcloud", "Paperless-ngx", "Google Drive", "Eigener Mail-Server"].includes(subcategory)
}

function normalizeFinanceForm(settings: Record<string, unknown>, financeResult: Record<string, unknown>): FinanceForm {
  const bankAccounts = Array.isArray(financeResult.bankAccounts) && financeResult.bankAccounts.length
    ? financeResult.bankAccounts.map(normalizeAccount)
    : [{
        ...fallbackFinanceForm.bankAccounts[0],
        bankName: stringValue(settings.bankName),
        accountHolder: stringValue(settings.company) || fallbackFinanceForm.company,
        iban: stringValue(settings.iban),
        bic: stringValue(settings.bic)
      }]

  return {
    company: stringValue(settings.company) || fallbackFinanceForm.company,
    taxNumber: stringValue(settings.taxNumber),
    vatId: stringValue(settings.vatId),
    registerCourt: stringValue(settings.registerCourt),
    defaultPaymentNote: stringValue(settings.defaultPaymentNote),
    bankAccounts: bankAccounts.some((account) => account.isDefault) ? bankAccounts : bankAccounts.map((account, index) => ({ ...account, isDefault: index === 0 })),
    paymentMethods: Array.isArray(financeResult.paymentMethods) && financeResult.paymentMethods.length ? financeResult.paymentMethods.map(normalizePaymentMethod) : defaultPaymentMethods,
    paymentProviderConfigs: ensureProviderConfigs(Array.isArray(financeResult.paymentProviderConfigs) ? financeResult.paymentProviderConfigs.map(normalizePaymentProvider) : fallbackFinanceForm.paymentProviderConfigs),
    paymentTerms: Array.isArray(financeResult.paymentTerms) && financeResult.paymentTerms.length ? financeResult.paymentTerms.map(normalizePaymentTerm) : defaultPaymentTerms,
    reminderPreparation: Array.isArray(financeResult.reminderPreparation) && financeResult.reminderPreparation.length ? financeResult.reminderPreparation.map(normalizeReminderPreparation) : defaultReminderPreparation
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

function normalizePaymentMethod(method: Partial<PaymentMethodForm>, index: number): PaymentMethodForm {
  return {
    key: method.key || "method_" + index,
    label: method.label || "Zahlungsart",
    enabled: Boolean(method.enabled),
    prepared: Boolean(method.prepared),
    sortOrder: Number(method.sortOrder ?? index * 10)
  }
}

function normalizePaymentProvider(provider: Partial<PaymentProviderForm>): PaymentProviderForm {
  const normalizedProvider = provider.provider === "stripe" || provider.provider === "finapi" ? provider.provider : "paypal"
  return {
    provider: normalizedProvider,
    apiKey: provider.apiKey || "",
    secretKey: provider.secretKey || "",
    webhookUrl: provider.webhookUrl || (normalizedProvider === "paypal" ? "/api/payments/webhooks/paypal" : normalizedProvider === "stripe" ? "/api/payments/webhooks/stripe" : "/api/finance/open-banking/finapi/webhook"),
    enabled: Boolean(provider.enabled)
  }
}

function ensureProviderConfigs(providers: PaymentProviderForm[]): PaymentProviderForm[] {
  const byProvider = new Map(providers.map((provider) => [provider.provider, provider]))
  return fallbackFinanceForm.paymentProviderConfigs.map((fallback) => byProvider.get(fallback.provider) ?? fallback)
}

function normalizePaymentTerm(term: Partial<PaymentTermForm>, index: number): PaymentTermForm {
  return {
    id: term.id,
    label: term.label || `${Number(term.days ?? 14)} Tage`,
    days: Number(term.days ?? 14),
    isDefault: Boolean(term.isDefault),
    active: term.active !== false,
    sortOrder: Number(term.sortOrder ?? index * 10)
  }
}

function normalizeReminderPreparation(item: Partial<ReminderPreparationForm>, index: number): ReminderPreparationForm {
  return {
    level: Number(item.level ?? index + 1),
    label: item.label || `Mahnstufe ${index + 1}`,
    daysAfterDue: Number(item.daysAfterDue ?? (index + 1) * 7),
    active: Boolean(item.active),
    templateNote: item.templateNote ?? null
  }
}

function updateFinanceAccountField(account: BankAccountForm, field: string, value: string, company: string): BankAccountForm {
  return {
    ...account,
    accountHolder: field === "Kontoinhaber" ? value : account.accountHolder || company,
    iban: field === "IBAN" ? value : account.iban,
    bic: field === "BIC" ? value : account.bic,
    bankName: field === "Bankname" ? value : account.bankName
  }
}

function financeValue(subcategory: string, field: string, form: FinanceForm) {
  const account = form.bankAccounts.find((item) => item.isDefault) ?? form.bankAccounts[0] ?? fallbackFinanceForm.bankAccounts[0]
  const defaultTerm = form.paymentTerms.find((term) => term.isDefault) ?? form.paymentTerms[0] ?? defaultPaymentTerms[2]
  const firstReminder = form.reminderPreparation[0] ?? defaultReminderPreparation[0]
  const bankTransfer = form.paymentMethods.find((method) => method.key === "bank_transfer")
  const paypalMethod = form.paymentMethods.find((method) => method.key === "paypal")
  const paypal = form.paymentProviderConfigs.find((provider) => provider.provider === "paypal") ?? fallbackFinanceForm.paymentProviderConfigs[0]

  if (subcategory === "Bankdaten") {
    if (field === "Kontoinhaber") return account.accountHolder
    if (field === "IBAN") return account.iban
    if (field === "BIC") return account.bic
    if (field === "Bankname") return account.bankName
  }

  if (subcategory === "Steuerdaten") {
    if (field === "Steuernummer") return form.taxNumber
    if (field === "USt-ID") return form.vatId
    if (field === "Registergericht") return form.registerCourt
    if (field === "Zahlungshinweis") return form.defaultPaymentNote
  }

  if (subcategory === "Zahlungsbasis") {
    if (field === "Standard-Zahlungsziel") return String(defaultTerm.days)
    if (field === "Erste Mahnung nach Tagen") return String(firstReminder.daysAfterDue)
    if (field === "Bankueberweisung aktiv") return String(bankTransfer?.enabled ?? true)
    if (field === "PayPal Zahlungsart aktiv") return String(paypalMethod?.enabled ?? false)
  }

  if (subcategory === "PayPal") {
    if (field === "Client ID") return paypal.apiKey
    if (field === "Secret") return paypal.secretKey
    if (field === "Webhook URL") return paypal.webhookUrl
    if (field === "Aktiv") return String(paypal.enabled)
  }

  return ""
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : ""
}
