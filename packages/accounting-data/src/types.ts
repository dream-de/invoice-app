export type AccountingDataStatus = "available" | "planned"

export type AccountingDataFormat = "sqlite" | "json"

export type AccountingDataSet = {
  id: string
  country: "DE" | "EU" | "GLOBAL"
  name: string
  description: string
  format: AccountingDataFormat
  status: AccountingDataStatus
  intendedFor: Array<"web" | "desktop" | "pro" | "enterprise">
  notes: string
}
