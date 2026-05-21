export type DesktopDownloadKind = "pdf" | "csv" | "json" | "xml"

export type DesktopDownloadPlan = {
  kind: DesktopDownloadKind
  suggestedName: string
  mimeType: string
  requiresNativeDialog: boolean
}

export function createDesktopDownloadPlan(input: {
  kind: DesktopDownloadKind
  suggestedName: string
}): DesktopDownloadPlan {
  const mimeTypes: Record<DesktopDownloadKind, string> = {
    pdf: "application/pdf",
    csv: "text/csv",
    json: "application/json",
    xml: "application/xml"
  }

  return {
    kind: input.kind,
    suggestedName: input.suggestedName,
    mimeType: mimeTypes[input.kind],
    requiresNativeDialog: true
  }
}
