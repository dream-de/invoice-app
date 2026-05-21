export { germanChartOfAccountsCatalog } from "./catalogs/de"
export type { AccountingDataFormat, AccountingDataSet, AccountingDataStatus } from "./types"

import { germanChartOfAccountsCatalog } from "./catalogs/de"
import type { AccountingDataSet } from "./types"

export const accountingDataCatalog: AccountingDataSet[] = [
  ...germanChartOfAccountsCatalog
]

export function listAccountingDataSets(country?: AccountingDataSet["country"]) {
  if (!country) return accountingDataCatalog
  return accountingDataCatalog.filter((dataSet) => dataSet.country === country)
}

export function findAccountingDataSet(id: string) {
  return accountingDataCatalog.find((dataSet) => dataSet.id === id) ?? null
}
