type StatusBadgeProps = {
  status: string
}

const statusStyles: Record<string, string> = {
  Aktiv: "bg-green-100 text-green-700",
  Bezahlt: "bg-green-100 text-green-700",
  Offen: "bg-yellow-100 text-yellow-700",
  Planung: "bg-blue-100 text-blue-700",
  Entwurf: "bg-neutral-200 text-neutral-700"
}

export function StatusBadge({
  status
}: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
        statusStyles[status] ??
        "bg-neutral-200 text-neutral-700"
      }`}
    >
      {status}
    </span>
  )
}
