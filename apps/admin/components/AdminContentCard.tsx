import type { ReactNode } from "react"

type AdminContentCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AdminContentCard({
  title,
  description,
  children
}: AdminContentCardProps) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white shadow-sm">
      <div className="border-b border-neutral-200 px-6 py-4">
        <h2 className="text-lg font-semibold">{title}</h2>

        {description ? (
          <p className="mt-1 text-sm text-neutral-600">
            {description}
          </p>
        ) : null}
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  )
}
