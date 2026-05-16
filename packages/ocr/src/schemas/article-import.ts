export type RecognizedArticle = {
  name: string
  number?: string
  category?: string
  description?: string
  unit?: string
  netPrice: number
  vatRate?: number
  confidence: number
}

export type ArticleImportResult = {
  ok: boolean
  fileName: string
  fileType: string
  articles: RecognizedArticle[]
  warnings: string[]
  unsupported?: boolean
}
