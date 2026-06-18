import { getPortalInvoices, date, money } from "@/lib/customer-portal/data"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../../Portal.module.css"

export const dynamic = "force-dynamic"

export default async function CustomerPortalOffersPage() {
  const customer = await requirePortalCustomer()
  const offers = await getPortalInvoices(customer.id, "offer")

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}><h1>Angebote</h1><span className={styles.muted}>Annahme vorbereitet</span></div>
      {offers.length ? (
        <table className={styles.table}>
          <thead><tr><th>Nummer</th><th>Datum</th><th>Status</th><th>Betrag</th><th>PDF</th></tr></thead>
          <tbody>
            {offers.map((offer) => (
              <tr key={offer.id}>
                <td>{offer.number}</td>
                <td>{date(offer.issueDate)}</td>
                <td><span className={styles.status}>{offer.status}</span></td>
                <td>{money(offer.grossTotal)}</td>
                <td><a className={styles.button} href={`/api/offer/pdf/${offer.id}`}>Herunterladen</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className={styles.empty}>Keine Angebote vorhanden.</p>}
    </section>
  )
}
