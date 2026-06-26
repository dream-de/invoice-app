"use client"

import { useState, type ComponentType } from "react"
import Link from "next/link"
import {
  Archive,
  BarChart3,
  Building2,
  CheckCircle2,
  Code2,
  FileText,
  Globe,
  Landmark,
  Mail,
  Palette,
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

const DEV_CARDS = [
  {
    title: "Berichte",
    description: "Analysen, Statistiken und Auswertungen oeffnen.",
    icon: BarChart3,
    href: "/dashboard-v2/reports"
  },
  {
    title: "Logs",
    description: "Logs und Aktivitaeten detailliert anzeigen.",
    icon: ScrollText,
    href: "/dashboard-v2/logs"
  }
]

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
  "User/User": ["Name", "E-Mail", "Rolle", "Status"],
  "User/Rollen": ["Rollenname", "Beschreibung", "Status"],
  "User/Rechte": ["Rechtegruppe", "Berechtigung", "Status"],
  "User/2FA": ["2FA aktiv", "Methode", "Backup-Codes"],
  "User/Sitzungen": ["Session Timeout", "Max. Sitzungen", "Status"],
  "Branding/Logo": ["Logo Upload", "Favicon Upload"],
  "Branding/Farben": ["Primaerfarbe", "Sekundaerfarbe", "Akzentfarbe"],
  "Branding/Dokumentauftritt": ["Briefkopf", "Fusszeile", "Dokumentstil"],
  "Finanzen/Bankdaten": ["Kontoinhaber", "IBAN", "BIC", "Bankname"],
  "Finanzen/Steuerdaten": ["Steuernummer", "USt-ID", "Standard-Steuersatz"],
  "Finanzen/Zahlungsbasis": ["Zahlungsziel", "Mahnstufe", "Skonto"],
  "Finanzen/PayPal": ["PayPal aktiv", "Client ID", "Secret", "Sandbox Modus"],
  "Dokumente/Dokumenttypen": ["Typ Name", "Beschreibung", "Aktiv"],
  "Dokumente/Vorlagen": ["Vorlagenname", "Dokumenttyp", "Status"],
  "Dokumente/Nummernkreise": ["Rechnungsnummer", "Angebotsnummer", "Kundennummer", "Projekt Nummer"],
  "Dokumente/Export": ["Export Format", "Ziel", "Status"],
  "Dokumente/Import": ["Import Format", "Quelle", "Status"],
  "API / Webhooks/API": ["API aktiv", "Basis URL", "Version"],
  "API / Webhooks/Webhooks": ["Webhook URL", "Event", "Status"],
  "API / Webhooks/Kategorien": ["Kategorie Name", "Beschreibung", "Status"],
  "API / Webhooks/API-Zugang": ["Zugriff aktiv", "OAuth aktiv", "Token Laufzeit"],
  "API / Webhooks/API Keys": ["API Key Name", "Key", "Status", "Ablaufdatum"],
  "API / Webhooks/Berechtigungen": ["Berechtigungsgruppe", "Zugriff", "Status"],
  "API / Webhooks/Limits": ["Rate Limit", "Requests pro Minute", "Status"],
  "System/Backup erstellen": ["Backup Name", "Backup Typ"],
  "System/Restore": ["Restore Datei", "Restore Modus"],
  "System/Export CSV": ["CSV Bereich", "Trennzeichen", "Export Ziel"],
  "Dev/Berichte": ["Bericht Name", "Zeitraum", "Status"],
  "Dev/Logs": ["Log Typ", "Zeitraum", "Level"],
  "Archiv/Export": ["Export Bereich", "Format", "Status"],
  "Archiv/Import": ["Import Datei", "Import Modus"],
  "Archiv/Archivieren": ["Archiv Name", "Zeitraum", "Status"],
  "E-Mail/E-Mail-Anbieter": ["Anbieter", "Absender E-Mail", "Status"],
  "E-Mail/SMTP": ["SMTP Host", "SMTP Port", "Benutzername", "Passwort", "Verschluesselung"],
  "E-Mail/Eigener Mail-Server": ["Server URL", "Benutzer", "Passwort"],
  "Portal/Portal Base URL": ["Portal URL", "Status"],
  "Portal/Publish API Key": ["Key Name", "Publish API Key", "Status"],
  "Portal/Paperless-ngx": ["Paperless URL", "Token", "Status"],
  "Portal/Nextcloud": ["Nextcloud URL", "Benutzer", "Passwort/App Token"],
  "Portal/Google Drive": ["Client ID", "Client Secret", "Status"]
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
  archive: "Archiv",
  email: "E-Mail",
  portal: "Portal"
}

export function PremiumSettingsSectionContent({ section = "company" }: { section?: PremiumSettingsSection | null }) {
  const initialCategory = section ? sectionToCategory[section] ?? "Unternehmen" : "Unternehmen"
  const [activeCategory, setActiveCategory] = useState(initialCategory)
  const [activeSubcategory, setActiveSubcategory] = useState(SETTINGS[initialCategory].items[0])
  const [settingsValues, setSettingsValues] = useState<SettingsValues>({})
  const [saveMessage, setSaveMessage] = useState("")

  const current = SETTINGS[activeCategory]
  const CategoryIcon = current.icon
  const isDevCategory = activeCategory === "Dev"
  const formKey = `${activeCategory}/${activeSubcategory}`
  const fields = FIELD_DEFINITIONS[formKey] ?? ["Name", "Status", "Beschreibung", "Aktiv"]

  function selectCategory(category: string) {
    setActiveCategory(category)
    setActiveSubcategory(SETTINGS[category].items[0])
    setSaveMessage("")
  }

  function handleChange(field: string, value: string) {
    setSettingsValues((currentValues) => ({
      ...currentValues,
      [formKey]: {
        ...(currentValues[formKey] ?? {}),
        [field]: value
      }
    }))
  }

  function handleSave() {
    setSaveMessage(`${formKey} wurde lokal vorbereitet.`)
  }

  function handleReset() {
    setSettingsValues((currentValues) => ({
      ...currentValues,
      [formKey]: {}
    }))
    setSaveMessage(`${formKey} wurde zurueckgesetzt.`)
  }

  function handleConnectionTest() {
    setSaveMessage(`Verbindungstest fuer ${formKey} vorbereitet.`)
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

          {isDevCategory ? (
            <section className={styles.settingsCardGrid}>
              {DEV_CARDS.map((card) => {
                const Icon = card.icon

                return (
                  <Link key={card.title} href={card.href} className={styles.settingsCard}>
                    <span className={styles.cardStatusDot} />

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
                    <span className={styles.cardStatusDot} />

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
                  <span className={styles.formStatusDot} />
                </div>

                <div className={styles.settingsFormGrid}>
                  {fields.map((field) => (
                    <label key={field} className={styles.settingsField}>
                      <span>{field}</span>
                      {renderField({
                        field,
                        value: settingsValues[formKey]?.[field] ?? "",
                        onChange: (value) => handleChange(field, value)
                      })}
                    </label>
                  ))}
                </div>

                <div className={styles.settingsFormActions}>
                  <button type="button" className={styles.btnPrimary} onClick={handleSave}>Speichern</button>
                  <button type="button" className={styles.btnSecondary} onClick={handleReset}>Zuruecksetzen</button>
                  {shouldShowTestButton(activeSubcategory) ? (
                    <button type="button" className={styles.btnSecondary} onClick={handleConnectionTest}>
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

        <aside className={styles.settingsStatusPanel}>
          <h3>Modulstatus</h3>

          {Object.entries(SETTINGS).map(([category, value]) => {
            const Icon = value.icon

            return (
              <button
                key={category}
                type="button"
                className={`${styles.statusRow} ${activeCategory === category ? styles.active : ""}`}
                onClick={() => selectCategory(category)}
              >
                <span>
                  <Icon size={18} />
                  {category}
                </span>
                <strong>
                  <i />
                  Aktiv
                </strong>
              </button>
            )
          })}

          <div className={styles.systemStatus}>
            <CheckCircle2 size={24} />
            <div>
              <h4>Systemstatus</h4>
              <p>Alle Systeme laufen einwandfrei.</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function renderField({ field, value, onChange }: { field: string; value: string; onChange: (value: string) => void }) {
  if (isSelectField(field)) {
    return (
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="">Bitte waehlen</option>
        <option value="Ja">Ja</option>
        <option value="Nein">Nein</option>
        <option value="Aktiv">Aktiv</option>
        <option value="Inaktiv">Inaktiv</option>
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
      type="text"
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

function isSelectField(field: string) {
  const normalized = field.toLowerCase()
  return normalized.includes("aktiv") || normalized.includes("status") || normalized.includes("sandbox") || normalized.includes("methode")
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
