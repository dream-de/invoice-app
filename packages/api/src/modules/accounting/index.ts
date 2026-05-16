import { ok } from "../../core/response"
import type { JournalEntry } from "@invoice-platform/accounting-core"
import { validateJournalEntry } from "@invoice-platform/accounting-core"

export function validateAccountingEntry(entry: JournalEntry) {
  return ok({
    valid: validateJournalEntry(entry).length === 0,
    errors: validateJournalEntry(entry)
  })
}
