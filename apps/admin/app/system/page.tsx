import { designTokens, PageHeader, StatCard } from "@dream-invoice/ui"
import { AdminContentCard } from "../../components/AdminContentCard"

export default function SystemPage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.u9cb760d000}>
        <PageHeader
          title="Systemstatus"
          description="Überwachung der Plattform"
        />

        <div className={designTokens.utility.u0b45bc1db1}>
          <StatCard
            label="API"
            value="Online"
            helper="Server aktiv"
          />

          <StatCard
            label="Database"
            value="OK"
            helper="Verbindung stabil"
          />

          <StatCard
            label="Deploy"
            value="Stable"
            helper="Keine Fehler"
          />
        </div>

        <AdminContentCard title="Systeminformationen">
          <div className={designTokens.utility.u7db266bed9}>
            <p>Node.js Runtime aktiv</p>
            <p>Turbo Repository stabil</p>
            <p>TypeScript Validierung erfolgreich</p>
          </div>
        </AdminContentCard>
      </div>
    </main>
  )
}
