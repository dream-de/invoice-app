import type { ReactNode } from "react"

type TableRowProps = {
  children: ReactNode
}

export function TableRow({ children }: TableRowProps) {
  return (
    <tr className="hover:bg-neutral-50">
      {children}
    </tr>
  )
}
