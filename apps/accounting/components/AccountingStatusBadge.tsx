type AccountingStatusBadgeProps = {
  status: string
}

const styles: Record<string, string> = {
  Ausgeglichen: "bg-green-500/10 text-green-300 border-green-500/30",
  Offen: "bg-yellow-500/10 text-yellow-300 border-yellow-500/30",
  Fehlerhaft: "bg-red-500/10 text-red-300 border-red-500/30",
  Aktiv: "bg-blue-500/10 text-blue-300 border-blue-500/30",
  Ertrag: "bg-purple-500/10 text-purple-300 border-purple-500/30"
}

export function AccountingStatusBadge({
  status
}: AccountingStatusBadgeProps) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${
        styles[status] ?? "bg-slate-800 text-slate-300 border-slate-700"
      }`}
    >
      {status}
    </span>
  )
}
