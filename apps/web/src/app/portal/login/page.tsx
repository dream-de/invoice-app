import { redirect } from "next/navigation"
import { getCurrentPortalCustomer } from "@/lib/customer-portal/auth"
import styles from "../Portal.module.css"
import LoginForm from "./LoginForm"

export const dynamic = "force-dynamic"

export default async function CustomerPortalLoginPage() {
  const customer = await getCurrentPortalCustomer()
  if (customer) redirect("/portal")

  return (
    <main className={styles.login}>
      <section className={styles.loginPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h1>Kundenportal</h1>
            <p className={styles.muted}>DreamInvoice Premium Edition</p>
          </div>
        </div>
        <LoginForm />
      </section>
    </main>
  )
}
