import {
  createDesktopServiceDescriptor,
  type DesktopServiceDescriptor,
  type DesktopServiceDomain
} from "@dream-invoice/desktop-services"

export const proDesktopServiceCatalog = [
  createDesktopServiceDescriptor({
    id: "account-suggestions",
    label: "Account Suggestions",
    domain: "accounting",
    proOnly: true,
    plannedCapabilities: ["keyword-seed", "account-suggestion-pipeline", "booking-assistance"]
  }),
  createDesktopServiceDescriptor({
    id: "audit-export",
    label: "Audit Export Package",
    domain: "audit",
    proOnly: true,
    plannedCapabilities: ["audit-package", "export-manifest", "checksum-summary"]
  }),
  createDesktopServiceDescriptor({
    id: "csv-import",
    label: "CSV Import",
    domain: "imports",
    proOnly: false,
    plannedCapabilities: ["mapping-preview", "validation-report", "safe-import"]
  }),
  createDesktopServiceDescriptor({
    id: "datev-export",
    label: "DATEV Export",
    domain: "finance",
    proOnly: true,
    plannedCapabilities: ["datev-csv", "account-mapping", "tax-mode-validation"]
  }),
  createDesktopServiceDescriptor({
    id: "dunning",
    label: "Dunning Service",
    domain: "documents",
    proOnly: false,
    plannedCapabilities: ["reminder-levels", "due-date-checks", "notification-queue"]
  }),
  createDesktopServiceDescriptor({
    id: "email",
    label: "Email Service",
    domain: "email",
    proOnly: false,
    plannedCapabilities: ["smtp-settings", "send-log", "template-rendering"]
  }),
  createDesktopServiceDescriptor({
    id: "eur-report",
    label: "EUR Report",
    domain: "finance",
    proOnly: true,
    plannedCapabilities: ["eur-catalog", "classification-pipeline", "suggestion-review"]
  }),
  createDesktopServiceDescriptor({
    id: "portal-client",
    label: "Portal Client",
    domain: "portal",
    proOnly: true,
    plannedCapabilities: ["portal-sync", "decision-polling", "public-document-links"]
  }),
  createDesktopServiceDescriptor({
    id: "recurring",
    label: "Recurring Service",
    domain: "recurring",
    proOnly: false,
    plannedCapabilities: ["recurring-invoices", "scheduled-runs", "retry-policy"]
  }),
  createDesktopServiceDescriptor({
    id: "skr-import",
    label: "SKR Import",
    domain: "accounting",
    proOnly: true,
    plannedCapabilities: ["skr03", "skr04", "account-catalog-import"]
  })
] as const satisfies readonly DesktopServiceDescriptor[]

export const proDesktopServiceDomains = Array.from(
  new Set(proDesktopServiceCatalog.map((service) => service.domain))
) as DesktopServiceDomain[]

export function findProDesktopService(serviceId: string) {
  return proDesktopServiceCatalog.find((service) => service.id === serviceId)
}
