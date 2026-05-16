export type JournalEntryLine = {
  accountId: string
  debit: number
  credit: number
}

export type JournalEntry = {
  id: string
  date: string
  description: string
  reference?: string
  lines: JournalEntryLine[]
}
