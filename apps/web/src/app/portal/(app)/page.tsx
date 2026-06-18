import Link from "next/link"
import { getPortalDashboard, money } from "@/lib/customer-portal/data"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../Portal.module.css"

export const dynamic = "force-dynamic"

export default async function CustomerPortalDashboardPage() {
  const customer = await requirePortalCustomer()
  const dashboard = await getPortalDashboard(customer.id)
  const openTotal = dashboard.openInvoices.reduce((sum, invoice) => sum + Number(invoice.grossTotal), 0)

  return (
    <>
      <div className={styles.grid}>
        <Link className={styles.card} href="/portal/invoices"><span>Offene Rechnungen</span><strong>{dashboard.openInvoices.length}</strong><span>{money(openTotal)}</span></Link>
        <Link className={styles.card} href="/portal/offers"><span>Angebote</span><strong>{dashboard.offers.length}</strong><span>PDF vorbereitet</span></Link>
        <Link className={styles.card} href="/portal/documents"><span>Dokumente</span><strong>{dashboard.attachments.length}</strong><span>Anhaenge verfuegbar</span></Link>
        <Link className={styles.card} href="/portal/profile"><span>Profil</span><strong>{customer.number}</strong><span>Kontaktdaten pruefen</span></Link>
      </div>
      <section className={styles.panel}>
        <div className={styles.panelHeader}><h1>Letzte Aktivitaeten</h1></div>
        {dashboard.activities.length ? (
          <table className={styles.table}>
            <tbody>
              {dashboard.activities.map((item) => (
                <tr key={item.label + item.date.toISOString()}>
                  <td>{item.label}</td>
                  <td><span className={styles.muted}>{item.detail}</span></td>
                  <td>{new Intl.DateTimeFormat("de-DE").format(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : <p className={styles.empty}>Noch keine Aktivitaeten vorhanden.</p>}
      </section>
    </>
  )
}
