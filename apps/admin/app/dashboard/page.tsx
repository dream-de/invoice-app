import { PageHeader, StatCard, designTokens } from "@dream-invoice/ui"

export default function AdminDashboardPage() {
  return (
    <main className={designTokens.admin.pageShell}>
      <div className={designTokens.admin.contentWide}>
        <PageHeader
          title="Admin Dashboard"
          description="Überblick über Plattform, Apps und Systemstatus"
        />

        <div className={designTokens.admin.statGrid}>
          <StatCard label="Invoice App" value="Aktiv" />
          <StatCard label="Accounting App" value="Aktiv" />
          <StatCard label="Server" value="OK" />
        </div>
      </div>
    </main>
  )
}
