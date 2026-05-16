import type { ReactNode } from "react"

type TableCellProps = {
  children: ReactNode
}

export function TableCell({ children }: TableCellProps) {
  return (
    <td className="px-4 py-3 text-sm text-neutral-700">
      {children}
    </td>
  )
}
