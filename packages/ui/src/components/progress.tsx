type ProgressProps = {
  value: number
  label?: string
}

export function Progress({
  value,
  label
}: ProgressProps) {
  const safeValue = Math.max(0, Math.min(100, value))

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex items-center justify-between text-xs font-bold text-neutral-500">
          <span>{label}</span>
          <span>{safeValue}%</span>
        </div>
      )}

      <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all"
          style={{ width: `${safeValue}%` }}
        />
      </div>
    </div>
  )
}
