import { designTokens } from "@dream-invoice/ui"
type AccountingStatCardProps = {
  label: string
  value: string
  helper?: string
}

export function AccountingStatCard({
  label,
  value,
  helper
}: AccountingStatCardProps) {
  return (
    <div className={designTokens.utility.u8cc03efa68}>
      <p className={designTokens.utility.u92a525a0c6}>{label}</p>
      <p className={designTokens.utility.u17fe1da1de}>{value}</p>

      {helper ? (
        <p className={designTokens.utility.ue37f5e8623}>{helper}</p>
      ) : null}
    </div>
  )
}
