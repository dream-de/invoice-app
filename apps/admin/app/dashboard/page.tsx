import { StatCard } from "@dream-invoice/ui"
import { PageHeader } from "@dream-invoice/ui"

export default function AdminDashboardPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Admin Dashboard"
          description="Überblick über Plattform, Apps und Systemstatus"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Invoice App" value="Aktiv" />
          <StatCard label="Accounting App" value="Aktiv" />
          <StatCard label="Server" value="OK" />
        </div>
      </div>
    </main>
  )
}
