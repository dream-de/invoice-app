import type { AccountingDataSet } from "../../types"

export const germanChartOfAccountsCatalog: AccountingDataSet[] = [
  {
    id: "de-skr03",
    country: "DE",
    name: "German SKR03 chart of accounts",
    description: "Planned metadata slot for a German SKR03 chart of accounts data set.",
    format: "sqlite",
    status: "planned",
    intendedFor: ["desktop", "pro", "enterprise"],
    notes: "The actual data file is intentionally not included yet. Add only verified and license-safe sources."
  },
  {
    id: "de-skr04",
    country: "DE",
    name: "German SKR04 chart of accounts",
    description: "Planned metadata slot for a German SKR04 chart of accounts data set.",
    format: "sqlite",
    status: "planned",
    intendedFor: ["desktop", "pro", "enterprise"],
    notes: "The actual data file is intentionally not included yet. Add only verified and license-safe sources."
  }
]
