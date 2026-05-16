import type { ReactNode } from "react"

type AccountingContentCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AccountingContentCard({
  title,
  description,
  children
}: AccountingContentCardProps) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="border-b border-slate-800 px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
