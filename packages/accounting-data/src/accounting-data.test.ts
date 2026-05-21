import assert from "node:assert/strict"
import test from "node:test"

import { accountingDataCatalog, findAccountingDataSet, listAccountingDataSets } from "./index"

test("accounting data catalog keeps planned German chart data explicit", () => {
  assert.deepEqual(
    accountingDataCatalog.map((dataSet) => dataSet.id),
    ["de-skr03", "de-skr04"]
  )
  assert.equal(findAccountingDataSet("de-skr03")?.status, "planned")
  assert.equal(findAccountingDataSet("unknown"), null)
})

test("accounting data catalog can be filtered by country", () => {
  assert.equal(listAccountingDataSets("DE").length, 2)
  assert.equal(listAccountingDataSets("GLOBAL").length, 0)
})
