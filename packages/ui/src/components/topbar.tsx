import type { ReactNode } from "react"

type TopbarProps = {
  title: string
  actions?: ReactNode
}

export function Topbar({
  title,
  actions
}: TopbarProps) {
  return (
    <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-8 py-4">
      <div>
        <h1 className="text-2xl font-bold">
          {title}
        </h1>
      </div>

      {actions ? (
        <div className="flex items-center gap-3">
          {actions}
        </div>
      ) : null}
    </header>
  )
}
