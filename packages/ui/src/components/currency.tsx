type CurrencyProps = {
  value: number
  locale?: string
  currency?: string
}

export function Currency({
  value,
  locale = "de-DE",
  currency = "EUR"
}: CurrencyProps) {
  return (
    <>
      {new Intl.NumberFormat(locale, {
        style: "currency",
        currency
      }).format(value)}
    </>
  )
}
