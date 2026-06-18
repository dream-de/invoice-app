import { getPortalInvoices, invoicePortalStatus, date, money } from "@/lib/customer-portal/data"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../../Portal.module.css"

function paymentLink(invoice: Awaited<ReturnType<typeof getPortalInvoices>>[number], provider: "paypal" | "stripe") {
  return invoice.paymentLinks.find((link) => link.provider === provider)?.checkoutUrl || "/api/portal/pay/" + invoice.id + "?provider=" + provider
}

export const dynamic = "force-dynamic"

function statusClass(status: string) {
  if (status === "Bezahlt") return `${styles.status} ${styles.statusPaid}`
  if (status === "Ueberfaellig") return `${styles.status} ${styles.statusOverdue}`
  return `${styles.status} ${styles.statusOpen}`
}

export default async function CustomerPortalInvoicesPage() {
  const customer = await requirePortalCustomer()
  const invoices = await getPortalInvoices(customer.id, "invoice")

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}><h1>Rechnungen</h1></div>
      {invoices.length ? (
        <table className={styles.table}>
          <thead><tr><th>Nummer</th><th>Datum</th><th>Faelligkeit</th><th>Status</th><th>Betrag</th><th>Zahlung</th><th>PDF</th></tr></thead>
          <tbody>
            {invoices.map((invoice) => {
              const status = invoicePortalStatus(invoice.status, invoice.dueDate, invoice.paidAt)
              return (
                <tr key={invoice.id}>
                  <td>{invoice.number}</td>
                  <td>{date(invoice.issueDate)}</td>
                  <td>{date(invoice.dueDate)}</td>
                  <td><span className={statusClass(status)}>{status}</span></td>
                  <td>{money(invoice.grossTotal)}</td>
                  <td>
                    {status === "Bezahlt" ? <span className={styles.status}>Bezahlt</span> : (
                      <span className={styles.actionGroup}>
                        <a className={styles.button} href={paymentLink(invoice, "paypal")}>Jetzt bezahlen</a>
                        <a className={styles.button} href={paymentLink(invoice, "stripe")}>Kreditkarte</a>
                      </span>
                    )}
                  </td>
                  <td><a className={styles.button} href={`/api/invoice/pdf/${invoice.id}`}>Rechnung herunterladen</a></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      ) : <p className={styles.empty}>Keine Rechnungen vorhanden.</p>}
    </section>
  )
}
