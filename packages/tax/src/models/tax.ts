export type TaxRate = 0 | 7 | 19

export type TaxCalculation = {
  net: number
  rate: number
  tax: number
  gross: number
}
