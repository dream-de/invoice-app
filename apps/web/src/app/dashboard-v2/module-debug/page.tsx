import { appRegistry } from "@/lib/modules/appRegistry"
import { getDashboardModules, getLockedModules, getMarketplaceModules, getSidebarModules, getVisibleModules, isModuleUsable } from "@/lib/modules/moduleEngine"
import { businessDatevModuleContext as context } from "@/lib/modules/mockLicenseContext"

const sectionStyle = {
  border: "1px solid #dbe3ef",
  borderRadius: 8,
  padding: 16,
  background: "#ffffff"
}

function ModuleList({ title, items }: { title: string; items: Array<{ key: string; name: string; status: string }> }) {
  return (
    <section style={sectionStyle}>
      <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>{title}</h2>
      <ul style={{ display: "grid", gap: 8, listStyle: "none", margin: 0, padding: 0 }}>
        {items.map((module) => (
          <li key={module.key} style={{ display: "flex", justifyContent: "space-between", gap: 12, borderBottom: "1px solid #edf2f7", paddingBottom: 8 }}>
            <span>{module.name}</span>
            <code>{module.status}</code>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default function ModuleDebugPage() {
  const visibleModules = getVisibleModules(context)
  const lockedModules = getLockedModules(context)
  const marketplaceModules = getMarketplaceModules(context)
  const sidebarModules = getSidebarModules(context)
  const dashboardModules = getDashboardModules(context)
  const openBankingUsable = isModuleUsable("open_banking", context)

  return (
    <main style={{ minHeight: "100vh", background: "#f6f8fb", color: "#172033", padding: 32 }}>
      <div style={{ margin: "0 auto", maxWidth: 1200 }}>
        <header style={{ marginBottom: 24 }}>
          <p style={{ color: "#64748b", fontSize: 13, fontWeight: 700, letterSpacing: 0, margin: "0 0 6px", textTransform: "uppercase" }}>Dynamic Module Engine</p>
          <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: 0 }}>Module Debug</h1>
        </header>

        <section style={{ ...sectionStyle, marginBottom: 16 }}>
          <h2 style={{ margin: "0 0 12px", fontSize: 18 }}>Context</h2>
          <div style={{ display: "grid", gap: 8 }}>
            <div><strong>Plan:</strong> {context.plan}</div>
            <div><strong>Lizenz:</strong> {context.licenseStatus}</div>
            <div><strong>Installierte Erweiterungen:</strong> {context.installedExtensions.join(", ") || "keine"}</div>
            <div><strong>Feature Flags:</strong> {Object.entries(context.featureFlags).filter(([, enabled]) => enabled).map(([key]) => key).join(", ") || "keine aktiv"}</div>
            <div><strong>Registrierte Module:</strong> {appRegistry.length}</div>
            <div><strong>Open Banking usable:</strong> {openBankingUsable ? "true" : "false"}</div>
          </div>
        </section>

        <div style={{ display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
          <ModuleList title="Sichtbare Module" items={visibleModules} />
          <ModuleList title="Gesperrte Module" items={lockedModules} />
          <ModuleList title="Marketplace Module" items={marketplaceModules} />
          <ModuleList title="Sidebar Module" items={sidebarModules} />
          <ModuleList title="Dashboard Module" items={dashboardModules} />
        </div>
      </div>
    </main>
  )
}
