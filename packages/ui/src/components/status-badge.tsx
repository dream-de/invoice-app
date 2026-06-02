type StatusTone = "success" | "warning" | "info" | "neutral"

type StatusBadgeProps = {
  status: string
  tone?: StatusTone
}

const toneStyles: Record<StatusTone, string> = {
  success: "bg-green-100 text-green-700",
  warning: "bg-yellow-100 text-yellow-800",
  info: "bg-blue-100 text-blue-700",
  neutral: "bg-neutral-200 text-neutral-700"
}

const statusTones: Record<string, StatusTone> = {
  Aktiv: "success",
  Bezahlt: "success",
  Offen: "warning",
  Planung: "info",
  Entwurf: "neutral"
}

export function StatusBadge({
  status,
  tone
}: StatusBadgeProps) {
  const resolvedTone = tone ?? statusTones[status] ?? "neutral"

  return (
    <span
      aria-label={"Status: " + status}
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${toneStyles[resolvedTone]}`}
    >
      {status}
    </span>
  )
}
