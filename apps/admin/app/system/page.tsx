import { StatCard } from "@dream-invoice/ui"
import { Table, TableCell, TableRow } from "@dream-invoice/ui"
import { AdminContentCard } from "../../components/AdminContentCard"
import { PageHeader } from "@dream-invoice/ui"

export default function SystemPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Systemstatus"
          description="Überwachung der Plattform"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
          <div className="space-y-2 text-sm text-neutral-700">
            <p>Node.js Runtime aktiv</p>
            <p>Turbo Repository stabil</p>
            <p>TypeScript Validierung erfolgreich</p>
          </div>
        </AdminContentCard>
      </div>
    </main>
  )
}
