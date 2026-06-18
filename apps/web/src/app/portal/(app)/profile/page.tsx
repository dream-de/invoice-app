import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../../Portal.module.css"
import ProfileForm from "./ProfileForm"

export const dynamic = "force-dynamic"

export default async function CustomerPortalProfilePage() {
  const customer = await requirePortalCustomer()
  const address = [customer.street, [customer.zip, customer.city].filter(Boolean).join(" "), customer.country].filter(Boolean)

  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}><h1>Profil</h1><span className={styles.muted}>{customer.number}</span></div>
      <div className={styles.form}>
        <p><strong>{customer.name}</strong></p>
        {address.map((line) => <p className={styles.muted} key={line}>{line}</p>)}
        <p className={styles.muted}>Portal-E-Mail: {customer.portalEmail ?? customer.email ?? "-"}</p>
      </div>
      <ProfileForm customer={customer} />
    </section>
  )
}
