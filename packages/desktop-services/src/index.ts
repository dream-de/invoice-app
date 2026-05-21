export type DesktopServiceStatus = "idle" | "running" | "failed"
export type DesktopServiceDomain =
  | "accounting"
  | "audit"
  | "banking"
  | "documents"
  | "einvoice"
  | "email"
  | "finance"
  | "imports"
  | "portal"
  | "recurring"

export type DesktopServiceDescriptor = {
  id: string
  label: string
  domain: DesktopServiceDomain
  proOnly: boolean
  plannedCapabilities: string[]
}

export function createDesktopServiceStatus(status: DesktopServiceStatus = "idle") {
  return { status }
}

export function createDesktopServiceDescriptor(
  descriptor: DesktopServiceDescriptor
): DesktopServiceDescriptor {
  return descriptor
}
