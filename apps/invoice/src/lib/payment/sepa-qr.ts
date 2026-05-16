type SepaQrPayloadInput = {
  beneficiaryName: string
  iban: string
  bic?: string | null
  amount: number
  remittance: string
}

function cleanLine(value: string, maxLength: number) {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength)
}

function cleanIban(value: string) {
  return value.replace(/\s+/g, "").toUpperCase()
}

export function createSepaQrPayload({
  beneficiaryName,
  iban,
  bic,
  amount,
  remittance
}: SepaQrPayloadInput) {
  const safeAmount = Math.max(0.01, Math.min(amount, 99999999.99))

  return [
    "BCD",
    "002",
    "1",
    "SCT",
    cleanLine(bic ?? "", 11),
    cleanLine(beneficiaryName, 70),
    cleanIban(iban),
    `EUR${safeAmount.toFixed(2)}`,
    "",
    "",
    cleanLine(remittance, 140),
    ""
  ].join("\n")
}
