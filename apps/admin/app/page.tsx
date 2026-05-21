import { StatCard } from "@dream-invoice/ui"
import { PageHeader } from "@dream-invoice/ui"

export default function AdminHomePage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl">
        <PageHeader
          title="Admin Platform"
          description="Verwaltung von Benutzern, System und Plattform-Einstellungen"
        />

        <div className="grid gap-6 md:grid-cols-3">
          <StatCard label="Benutzer" value="0" />
          <StatCard label="Apps" value="3" />
          <StatCard label="Status" value="OK" />
        </div>
      </div>
    </main>
  )
}
