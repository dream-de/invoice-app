import { ok } from "../../core/response"
import type { JournalEntry } from "@dream-invoice/accounting-core"
import { validateJournalEntry } from "@dream-invoice/accounting-core"

export function validateAccountingEntry(entry: JournalEntry) {
  return ok({
    valid: validateJournalEntry(entry).length === 0,
    errors: validateJournalEntry(entry)
  })
}
