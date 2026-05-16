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
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>

      {helper ? (
        <p className="mt-2 text-sm text-slate-500">{helper}</p>
      ) : null}
    </div>
  )
}
