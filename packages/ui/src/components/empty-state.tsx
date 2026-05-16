import type { ReactNode } from "react"

type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({
  title,
  description,
  action
}: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
      <h3 className="text-xl font-semibold">
        {title}
      </h3>

      {description ? (
        <p className="mt-2 text-neutral-600">
          {description}
        </p>
      ) : null}

      {action ? (
        <div className="mt-6 flex justify-center">
          {action}
        </div>
      ) : null}
    </div>
  )
}
