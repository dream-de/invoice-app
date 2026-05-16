import type { ReactNode } from "react"

type PageGridProps = {
  children: ReactNode
}

export function PageGrid({
  children
}: PageGridProps) {
  return (
    <div className="grid gap-6">
      {children}
    </div>
  )
}
