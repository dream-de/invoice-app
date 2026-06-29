"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Landmark,
  LockKeyhole,
  Search,
  ShieldCheck,
  Smartphone,
  Sparkles,
  WalletCards
} from "lucide-react"
import { createMockBankConnection, mockBankAccounts, type MockBankConnectionResult } from "@/lib/open-banking/openBankingMockService"
import styles from "./BankConnectPage.module.css"

type Bank = {
  name: string
  shortName: string
  tone: "red" | "blue" | "amber" | "violet" | "orange" | "slate"
}

const recommendedBanks: readonly Bank[] = [
  { name: "Sparkasse", shortName: "S", tone: "red" },
  { name: "Volksbank", shortName: "VB", tone: "blue" },
  { name: "Commerzbank", shortName: "CB", tone: "amber" },
  { name: "Deutsche Bank", shortName: "DB", tone: "violet" },
  { name: "DKB", shortName: "DKB", tone: "blue" },
  { name: "ING", shortName: "ING", tone: "orange" },
  { name: "N26", shortName: "N26", tone: "slate" },
  { name: "Santander", shortName: "SAN", tone: "red" }
] as const

const moreBanks: readonly Bank[] = [
  { name: "Postbank", shortName: "PB", tone: "blue" },
  { name: "HypoVereinsbank", shortName: "HVB", tone: "red" },
  { name: "TARGOBANK", shortName: "TB", tone: "blue" },
  { name: "Revolut", shortName: "R", tone: "slate" },
  { name: "Mehr", shortName: "+", tone: "violet" }
] as const

const steps = ["Bank wählen", "Authentifizierung", "Konto auswählen", "Verbindung bestätigen"] as const
const benefits = ["Sichere Verbindung", "Automatische Synchronisation", "Zahlungsabgleich", "Live Kontostand", "Keine Zugangsdaten speichern"] as const

function bankInitial(bank: Bank) {
  return bank.shortName.length > 2 ? bank.shortName.slice(0, 3) : bank.shortName
}

export function BankConnectPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [query, setQuery] = useState("")
  const [selectedBank, setSelectedBank] = useState<Bank>(recommendedBanks[5])
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(["business", "tax"])
  const [connection, setConnection] = useState<MockBankConnectionResult | null>(null)

  const filteredRecommended = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return recommendedBanks
    return recommendedBanks.filter((bank) => bank.name.toLowerCase().includes(normalized))
  }, [query])

  function goNext() {
    if (step < 3) setStep((current) => current + 1)
  }

  function goBack() {
    if (step > 0) setStep((current) => current - 1)
  }

  function finishConnection() {
    const result = createMockBankConnection(selectedBank.name, selectedAccounts)
    setConnection(result)
    window.setTimeout(() => router.push("/dashboard-v2/finance?open_banking=connected"), 450)
  }

  function toggleAccount(accountId: string) {
    setSelectedAccounts((current) =>
      current.includes(accountId)
        ? current.filter((id) => id !== accountId)
        : [...current, accountId]
    )
  }

  return (
    <section className={styles.bankConnectPage}>
      <div className={styles.breadcrumb}>
        <span>Finanzen</span>
        <ChevronRight size={14} />
        <span>Bankkonten</span>
        <ChevronRight size={14} />
        <strong>Bank verbinden</strong>
      </div>

      <header className={styles.hero}>
        <div>
          <h1>Bank verbinden</h1>
          <p>Verbinden Sie Ihr Bankkonto sicher über Open Banking (PSD2). Ihre Zugangsdaten werden niemals gespeichert.</p>
        </div>
        <aside className={styles.securityBox}>
          <LockKeyhole size={22} />
          <div>
            <strong>Sicher & DSGVO-konform</strong>
            <span>Ihre Daten werden verschlüsselt übertragen und ausschließlich für die Synchronisation verwendet.</span>
          </div>
        </aside>
      </header>

      <nav className={styles.stepper} aria-label="Bank verbinden Schritte">
        {steps.map((label, index) => (
          <button key={label} type="button" data-active={index === step} data-done={index < step} onClick={() => index <= step ? setStep(index) : undefined}>
            <span>{index < step ? <Check size={14} /> : index + 1}</span>
            <strong>{label}</strong>
          </button>
        ))}
      </nav>

      <div className={styles.contentGrid}>
        <main className={styles.flowCard}>
          {step === 0 ? (
            <section className={styles.bankStep}>
              <div className={styles.sectionTitle}>
                <h2>Bank auswählen</h2>
                <p>Wählen Sie Ihre Bank aus der Liste oder suchen Sie nach Ihrer Bank.</p>
              </div>
              <div className={styles.bankFilters}>
                <label>
                  <Search size={17} />
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Bank suchen…" />
                </label>
                <select defaultValue="Deutschland" aria-label="Land auswählen">
                  <option>Deutschland</option>
                </select>
              </div>

              <div className={styles.bankGroup}>
                <span>Empfohlene Banken</span>
                <div className={styles.bankGrid}>
                  {filteredRecommended.map((bank) => (
                    <button key={bank.name} type="button" data-selected={selectedBank.name === bank.name} onClick={() => setSelectedBank(bank)}>
                      <i data-tone={bank.tone}>{bankInitial(bank)}</i>
                      <strong>{bank.name}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.bankGroup}>
                <span>Weitere Banken</span>
                <div className={styles.moreBankGrid}>
                  {moreBanks.map((bank) => (
                    <button key={bank.name} type="button" data-selected={selectedBank.name === bank.name} onClick={() => setSelectedBank(bank)}>
                      <i data-tone={bank.tone}>{bankInitial(bank)}</i>
                      <strong>{bank.name}</strong>
                    </button>
                  ))}
                </div>
              </div>

              <button className={styles.missingBankButton} type="button">Meine Bank ist nicht in der Liste</button>
              <div className={styles.actionRow}>
                <span />
                <button className={styles.primaryButton} type="button" onClick={goNext}>Weiter <ArrowRight size={16} /></button>
              </div>
            </section>
          ) : null}

          {step === 1 ? (
            <section className={styles.authStep}>
              <div className={styles.bankLogo} data-tone={selectedBank.tone}>{bankInitial(selectedBank)}</div>
              <h2>{selectedBank.name}</h2>
              <p>Sie werden zur sicheren Authentifizierung zu Ihrer Bank weitergeleitet.</p>
              <div className={styles.redirectBox}>
                <Smartphone size={20} />
                <span>Sie verlassen DreamInvoice. Nach erfolgreicher Authentifizierung werden Sie automatisch zurückgeleitet.</span>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={goBack}><ArrowLeft size={16} />Zurück</button>
                <button className={styles.primaryButton} type="button" onClick={goNext}>Zur Bank <ArrowRight size={16} /></button>
              </div>
            </section>
          ) : null}

          {step === 2 ? (
            <section className={styles.accountStep}>
              <div className={styles.sectionTitle}>
                <h2>Konto auswählen</h2>
                <p>Wählen Sie die Konten aus, die Sie mit DreamInvoice synchronisieren möchten.</p>
              </div>
              <div className={styles.accountList}>
                {mockBankAccounts.map((account) => (
                  <label key={account.id} className={styles.accountRow}>
                    <input type="checkbox" checked={selectedAccounts.includes(account.id)} onChange={() => toggleAccount(account.id)} />
                    <span><strong>{account.name}</strong><small>{account.ibanMasked}</small></span>
                    <b>{account.balance}</b>
                  </label>
                ))}
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={goBack}><ArrowLeft size={16} />Zurück</button>
                <button className={styles.primaryButton} type="button" onClick={goNext} disabled={!selectedAccounts.length}>Weiter <ArrowRight size={16} /></button>
              </div>
            </section>
          ) : null}

          {step === 3 ? (
            <section className={styles.confirmStep}>
              <div className={styles.successMark}><Check size={36} /></div>
              <h2>Bank erfolgreich verbunden!</h2>
              <p>Ihre Konten werden jetzt synchronisiert.</p>
              <div className={styles.summaryBox}>
                <div><span>Bank</span><strong>{connection?.bankName ?? selectedBank.name}</strong></div>
                <div><span>Konten</span><strong>{connection?.accountCount ?? selectedAccounts.length}</strong></div>
                <div><span>Status</span><strong>{connection?.status ?? "Synchronisation läuft"}</strong></div>
                <div><span>Verbunden am</span><strong>{connection?.connectedAt ?? new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date())}</strong></div>
              </div>
              <div className={styles.actionRow}>
                <button className={styles.secondaryButton} type="button" onClick={goBack}><ArrowLeft size={16} />Zurück</button>
                <button className={styles.primaryButton} type="button" onClick={finishConnection}>Fertig</button>
              </div>
            </section>
          ) : null}
        </main>

        <aside className={styles.benefitCard}>
          <div className={styles.benefitTitle}>
            <Sparkles size={20} />
            <h2>Ihre Vorteile mit Open Banking</h2>
          </div>
          <div className={styles.benefitList}>
            {benefits.map((benefit) => (
              <div key={benefit}>
                <CheckCircle2 size={18} />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
          <div className={styles.safeNote}>
            <ShieldCheck size={20} />
            <strong>Ihre Bankzugangsdaten werden niemals von DreamInvoice gespeichert.</strong>
          </div>
          <div className={styles.mockStatus}>
            <div><Landmark size={17} /><span>Provider</span><strong>Open Banking Mock</strong></div>
            <div><WalletCards size={17} /><span>Status</span><strong>UI-Flow vorbereitet</strong></div>
            <div><Building2 size={17} /><span>Bank</span><strong>{selectedBank.name}</strong></div>
          </div>
        </aside>
      </div>
    </section>
  )
}
