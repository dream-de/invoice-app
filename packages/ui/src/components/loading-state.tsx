type LoadingStateProps = {
  label?: string
}

export function LoadingState({
  label = "Wird geladen..."
}: LoadingStateProps) {
  return (
    <div className="space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="h-4 w-1/3 rounded bg-neutral-200 animate-pulse" />
      <div className="h-10 w-full rounded bg-neutral-200 animate-pulse" />
      <div className="h-10 w-full rounded bg-neutral-200 animate-pulse" />

      <p className="text-sm text-neutral-500">
        {label}
      </p>
    </div>
  )
}
