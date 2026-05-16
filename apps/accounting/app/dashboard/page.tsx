import { StatCard } from "@invoice-platform/ui"
import { AccountingContentCard } from "../../components/AccountingContentCard"
import { PageHeader } from "@invoice-platform/ui"
import { AccountingStatusBadge } from "../../components/AccountingStatusBadge"

export default function AccountingDashboardPage() {
  return (
    <main className="p-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <PageHeader
          title="Accounting Dashboard"
          description="Überblick über Buchhaltung, Journal und Konten"
        />

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <StatCard label="Aktive Konten" value="3" helper="Demo-Kontenplan" />
          <StatCard label="Journal Entries" value="1" helper="Demo-Buchung" />
          <StatCard label="Status" value="OK" helper="Buchhaltung ausgeglichen" />
        </div>

        <AccountingContentCard
          title="Buchhaltungsstatus"
          description="Aktuelle Systemprüfung"
        >
          <div className="flex flex-wrap gap-3">
            <AccountingStatusBadge status="Ausgeglichen" />
            <AccountingStatusBadge status="Aktiv" />
          </div>
        </AccountingContentCard>
      </div>
    </main>
  )
}
