import type { JournalEntry } from "../models/journal-entry"

export function calculateDebitTotal(entry: JournalEntry): number {
  return Number(entry.lines.reduce((sum, line) => sum + line.debit, 0).toFixed(2))
}

export function calculateCreditTotal(entry: JournalEntry): number {
  return Number(entry.lines.reduce((sum, line) => sum + line.credit, 0).toFixed(2))
}

export function isBalancedJournalEntry(entry: JournalEntry): boolean {
  return calculateDebitTotal(entry) === calculateCreditTotal(entry)
}
