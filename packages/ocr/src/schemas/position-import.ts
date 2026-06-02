export type RecognizedPosition = {
  label: string
  qty: number
  netPrice: number
  category?: string
  confidence: number
}

export type PositionImportResult = {
  ok: boolean
  fileName: string
  fileType: string
  positions: RecognizedPosition[]
  warnings: string[]
  unsupported?: boolean
}
