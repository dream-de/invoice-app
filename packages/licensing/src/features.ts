export const licenseFeatures = [
  "invoices",
  "customers",
  "articles",
  "pdfExport",
  "templates",
  "demoData",
  "desktopShell",
  "desktopOffline",
  "eInvoice",
  "datevExport",
  "financeAutomation",
  "recurringInvoices",
  "dunning",
  "multiCompany",
  "teamUsers",
  "auditLog",
  "apiAccess",
  "prioritySupport"
] as const

export type LicenseFeature = (typeof licenseFeatures)[number]

export const licenseFeatureLabels: Record<LicenseFeature, string> = {
  invoices: "Invoices",
  customers: "Customers",
  articles: "Articles",
  pdfExport: "PDF export",
  templates: "Templates",
  demoData: "Demo data",
  desktopShell: "Desktop shell",
  desktopOffline: "Desktop offline mode",
  eInvoice: "E-invoice",
  datevExport: "DATEV export",
  financeAutomation: "Finance automation",
  recurringInvoices: "Recurring invoices",
  dunning: "Dunning",
  multiCompany: "Multi-company",
  teamUsers: "Team users",
  auditLog: "Audit log",
  apiAccess: "API access",
  prioritySupport: "Priority support"
}
