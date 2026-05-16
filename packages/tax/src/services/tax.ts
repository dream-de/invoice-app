import type { TaxCalculation } from "../models/tax"

export function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

export function calculateVAT(net: number, rate: number): number {
  return roundMoney(net * (rate / 100))
}

export function calculateGross(net: number, rate: number): number {
  return roundMoney(net + calculateVAT(net, rate))
}

export function calculateNet(gross: number, rate: number): number {
  return roundMoney(gross / (1 + rate / 100))
}

export function calculateTax(net: number, rate: number): TaxCalculation {
  const tax = calculateVAT(net, rate)
  const gross = calculateGross(net, rate)

  return {
    net: roundMoney(net),
    rate,
    tax,
    gross
  }
}
