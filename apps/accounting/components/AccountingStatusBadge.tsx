import { designTokens } from "@dream-invoice/ui"

type AccountingStatusBadgeProps = {
  status: string
}

const styles: Record<string, string> = {
  Ausgeglichen: designTokens.accountingStatusBadge.balanced,
  Offen: designTokens.accountingStatusBadge.open,
  Fehlerhaft: designTokens.accountingStatusBadge.error,
  Aktiv: designTokens.accountingStatusBadge.active,
  Ertrag: designTokens.accountingStatusBadge.revenue
}

export function AccountingStatusBadge({
  status
}: AccountingStatusBadgeProps) {
  const statusStyle = styles[status] ?? designTokens.accountingStatusBadge.fallback
  const className = [designTokens.accountingStatusBadge.base, statusStyle].join(" ")

  return (
    <span className={className}>
      {status}
    </span>
  )
}
