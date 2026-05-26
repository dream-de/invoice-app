import { designTokens, PageHeader, StatCard } from "@dream-invoice/ui"

export default function AdminHomePage() {
  return (
    <main className={designTokens.utility.ua4d0f420b7}>
      <div className={designTokens.utility.uadc5ca2753}>
        <PageHeader
          title="Admin Platform"
          description="Verwaltung von Benutzern, System und Plattform-Einstellungen"
        />

        <div className={designTokens.utility.u121913d0a0}>
          <StatCard label="Benutzer" value="0" />
          <StatCard label="Apps" value="3" />
          <StatCard label="Status" value="OK" />
        </div>
      </div>
    </main>
  )
}
