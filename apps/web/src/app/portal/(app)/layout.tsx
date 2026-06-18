import Link from "next/link"
import { redirect } from "next/navigation"
import { requirePortalCustomer } from "@/lib/customer-portal/auth"
import LogoutButton from "./logout-button"
import styles from "../Portal.module.css"

export const dynamic = "force-dynamic"

export default async function CustomerPortalLayout({ children }: { children: React.ReactNode }) {
  const customer = await requirePortalCustomer().catch(() => null)
  if (!customer) redirect("/portal/login")

  return (
    <div className={styles.shell}>
      <header className={styles.topbar}>
        <div className={styles.brand}>
          <strong>Kundenportal</strong>
          <span>{customer.name}</span>
        </div>
        <nav className={styles.nav} aria-label="Kundenportal">
          <Link href="/portal">Dashboard</Link>
          <Link href="/portal/invoices">Rechnungen</Link>
          <Link href="/portal/offers">Angebote</Link>
          <Link href="/portal/documents">Dokumente</Link>
          <Link href="/portal/profile">Profil</Link>
          <LogoutButton />
        </nav>
      </header>
      <main className={styles.main}>{children}</main>
    </div>
  )
}
