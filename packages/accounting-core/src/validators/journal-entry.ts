import type { JournalEntry } from "../models/journal-entry"
import { isBalancedJournalEntry } from "../services/journal-entry"

export function validateJournalEntry(entry: JournalEntry): string[] {
  const errors: string[] = []

  if (!entry.date) errors.push("Date is required")
  if (!entry.description) errors.push("Description is required")
  if (entry.lines.length < 2) errors.push("At least two journal entry lines are required")
  if (!isBalancedJournalEntry(entry)) errors.push("Journal entry is not balanced")

  return errors
}
