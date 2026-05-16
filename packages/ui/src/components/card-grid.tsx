import type { ReactNode } from "react"

type CardGridProps = {
  children: ReactNode
  columns?: 1 | 2 | 3 | 4
  className?: string
}

const columnMap = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
}

export function CardGrid({
  children,
  columns = 3,
  className = ""
}: CardGridProps) {
  return (
    <div
      className={`grid gap-6 ${columnMap[columns]} ${className}`}
    >
      {children}
    </div>
  )
}
