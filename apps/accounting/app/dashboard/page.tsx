import { designTokens, PageHeader, StatCard } from "@dream-invoice/ui"
import { AccountingContentCard } from "../../components/AccountingContentCard"
import { AccountingStatusBadge } from "../../components/AccountingStatusBadge"

export default function AccountingDashboardPage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.u9cb760d000}>
        <PageHeader
          title="Accounting Dashboard"
          description="Überblick über Buchhaltung, Journal und Konten"
        />

        <div className={designTokens.utility.u0b45bc1db1}>
          <StatCard label="Aktive Konten" value="3" helper="Demo-Kontenplan" />
          <StatCard label="Journal Entries" value="1" helper="Demo-Buchung" />
          <StatCard label="Status" value="OK" helper="Buchhaltung ausgeglichen" />
        </div>

        <AccountingContentCard
          title="Buchhaltungsstatus"
          description="Aktuelle Systemprüfung"
        >
          <div className={designTokens.utility.ue6ee580267}>
            <AccountingStatusBadge status="Ausgeglichen" />
            <AccountingStatusBadge status="Aktiv" />
          </div>
        </AccountingContentCard>
      </div>
    </main>
  )
}
