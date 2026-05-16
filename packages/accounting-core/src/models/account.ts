export type AccountType =
  | "asset"
  | "liability"
  | "equity"
  | "revenue"
  | "expense"

export type Account = {
  id: string
  code: string
  name: string
  type: AccountType
  active: boolean
}
