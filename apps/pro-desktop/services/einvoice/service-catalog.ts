import {
  createDesktopServiceDescriptor,
  type DesktopServiceDescriptor
} from "@dream-invoice/desktop-services"

export const proDesktopEinvoiceServices = [
  createDesktopServiceDescriptor({
    id: "embed-zugferd-pdf",
    label: "Embed ZUGFeRD PDF",
    domain: "einvoice",
    proOnly: true,
    plannedCapabilities: ["pdf-attachment", "zugferd-profile", "validation-report"]
  }),
  createDesktopServiceDescriptor({
    id: "normalize-invoice-einvoice",
    label: "Normalize Invoice for E-Invoice",
    domain: "einvoice",
    proOnly: true,
    plannedCapabilities: ["invoice-normalization", "buyer-seller-party", "tax-breakdown"]
  }),
  createDesktopServiceDescriptor({
    id: "zugferd-xml",
    label: "ZUGFeRD XML",
    domain: "einvoice",
    proOnly: true,
    plannedCapabilities: ["xml-generation", "en16931", "schema-ready-output"]
  })
] as const satisfies readonly DesktopServiceDescriptor[]
