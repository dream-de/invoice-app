import styles from "../../Portal.module.css"
import InviteForm from "./InviteForm"

export const dynamic = "force-dynamic"

export default async function CustomerPortalInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params

  return (
    <main className={styles.login}>
      <section className={styles.loginPanel}>
        <div className={styles.panelHeader}>
          <div>
            <h1>Portal aktivieren</h1>
            <p className={styles.muted}>Passwort fuer den Einladungslink festlegen.</p>
          </div>
        </div>
        <InviteForm token={token} />
      </section>
    </main>
  )
}
