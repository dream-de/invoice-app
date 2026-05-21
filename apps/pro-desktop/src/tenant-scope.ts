export type ProDesktopTenantScope = {
  tenantId: string
  mode: "single-tenant" | "multi-tenant"
}

export const defaultProDesktopTenantScope: ProDesktopTenantScope = {
  tenantId: "local-demo",
  mode: "single-tenant"
}
