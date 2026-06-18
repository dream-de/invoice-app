import { getPortalAttachments, date } from "@/lib/customer-portal/data"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../../Portal.module.css"

export const dynamic = "force-dynamic"

function sizeLabel(size: number) {
  if (size > 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`
  if (size > 1024) return `${Math.round(size / 1024)} KB`
  return `${size} B`
}

export default async function CustomerPortalDocumentsPage() {
  const customer = await requirePortalCustomer()
  const documents = await getPortalAttachments(customer.id)

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}><h1>Dokumente</h1></div>
      {documents.length ? (
        <table className={styles.table}>
          <thead><tr><th>Datei</th><th>Projekt</th><th>Datum</th><th>Groesse</th><th>Download</th></tr></thead>
          <tbody>
            {documents.map((document) => (
              <tr key={document.id}>
                <td>{document.originalName}</td>
                <td>{document.expense?.project?.name ?? "-"}</td>
                <td>{date(document.createdAt)}</td>
                <td>{sizeLabel(document.size)}</td>
                <td><a className={styles.button} href={`/api/portal/documents/${document.id}/download`}>Herunterladen</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : <p className={styles.empty}>Keine Dokumente vorhanden.</p>}
    </section>
  )
}
