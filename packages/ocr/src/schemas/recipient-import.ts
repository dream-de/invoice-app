export type RecognizedRecipient = {
  company: string
  contact?: string
  email?: string
  street?: string
  zip?: string
  city?: string
  country?: string
  vatId?: string
  confidence: number
}

export type RecipientImportResult = {
  ok: boolean
  fileName: string
  fileType: string
  recipient?: RecognizedRecipient
  warnings: string[]
  unsupported?: boolean
}
