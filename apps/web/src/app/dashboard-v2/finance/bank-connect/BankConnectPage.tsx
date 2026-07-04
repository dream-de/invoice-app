"use client"

import Link from "next/link"
import { ArrowLeft, Building2, Landmark, LockKeyhole, Settings, ShieldAlert, WalletCards } from "lucide-react"
import styles from "./BankConnectPage.module.css"

export function BankConnectPage() {
  return (
    <section className={styles.bankConnectPage}>
      <div className={styles.breadcrumb}>
        <span>Finanzen</span>
        <span>/</span>
        <span>Bankkonten</span>
        <span>/</span>
        <strong>Bank verbinden</strong>
      </div>

      <header className={styles.hero}>
        <div>
          <h1>Open Banking noch nicht konfiguriert</h1>
          <p>Für echte PSD2-Bankverbindungen muss ein Banking-Provider konfiguriert werden.</p>
        </div>
        <aside className={styles.securityBox}>
          <LockKeyhole size={22} />
          <div>
            <strong>Keine echte Bankverbindung aktiv</strong>
            <span>DreamInvoice speichert ohne Provider keine Bank-Logins, keine PSD2-Consents und keine Dummy-Konten als Verbindung.</span>
          </div>
        </aside>
      </header>

      <div className={styles.contentGrid}>
        <main className={styles.flowCard}>
          <section className={styles.providerNotice}>
            <div className={styles.noticeMark}><ShieldAlert size={34} /></div>
            <div className={styles.sectionTitle}>
              <span>Provider nicht eingerichtet</span>
              <h2>Open Banking noch nicht konfiguriert</h2>
              <p>Für echte PSD2-Bankverbindungen muss ein Banking-Provider konfiguriert werden. Solange kein aktiver Provider mit gültigen Zugangsdaten eingerichtet ist, kann die Bankverbindung nicht abgeschlossen werden.</p>
            </div>

            <div className={styles.summaryBox}>
              <div><span>Status</span><strong>Provider nicht eingerichtet</strong></div>
              <div><span>Open Banking Status</span><strong>Nicht konfiguriert</strong></div>
              <div><span>Bankverbindungen</span><strong>0 aktiv</strong></div>
              <div><span>Demo-Daten</span><strong>Keine echte Bankverbindung</strong></div>
            </div>

            <div className={styles.demoDisclosure}>
              <strong>Demo-Modus</strong>
              <span>Keine echte Bankverbindung</span>
              <span>Nur Beispieldaten</span>
            </div>

            <div className={styles.actionRow}>
              <Link className={styles.secondaryButton} href="/dashboard-v2/finance"><ArrowLeft size={16} />Zurück zu Finanzen</Link>
              <Link className={styles.primaryButton} href="/dashboard-v2/settings"><Settings size={16} />Provider konfigurieren</Link>
            </div>
          </section>
        </main>

        <aside className={styles.benefitCard}>
          <div className={styles.benefitTitle}>
            <Landmark size={20} />
            <h2>Open-Banking-Status</h2>
          </div>
          <div className={styles.mockStatus}>
            <div><Landmark size={17} /><span>Provider</span><strong>Nicht konfiguriert</strong></div>
            <div><WalletCards size={17} /><span>Status</span><strong>Keine Verbindung möglich</strong></div>
            <div><Building2 size={17} /><span>Konten</span><strong>Keine echten Bankkonten</strong></div>
          </div>
          <div className={styles.safeNote}>
            <ShieldAlert size={20} />
            <strong>Der bisherige Mock-Flow ist deaktiviert und kann keine erfolgreiche PSD2-Verbindung mehr vortäuschen.</strong>
          </div>
        </aside>
      </div>
    </section>
  )
}
