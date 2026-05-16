import type { ReactNode } from "react"

type ErrorStateProps = {
  title?: string
  description?: string
  message?: string
  action?: ReactNode
}

export function ErrorState({
  title = "Fehler",
  description,
  message,
  action
}: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 shadow-sm">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          {title}
        </h2>

        {(description || message) && (
          <p className="text-sm text-red-700">
            {description || message}
          </p>
        )}
      </div>

      {action && (
        <div className="mt-4">
          {action}
        </div>
      )}
    </div>
  )
}
