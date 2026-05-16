import type { ReactNode } from "react"

type DataToolbarProps = {
  children: ReactNode
}

export function DataToolbar({
  children
}: DataToolbarProps) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      {children}
    </div>
  )
}
