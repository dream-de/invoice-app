import type { TaxRate } from "../models/tax"

export function isValidGermanVatRate(rate: number): rate is TaxRate {
  return rate === 0 || rate === 7 || rate === 19
}
