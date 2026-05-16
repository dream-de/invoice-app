import type { ReactNode } from "react"

type TableProps = {
  headers: string[]
  children: ReactNode
}

export function Table({ headers, children }: TableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <table className="min-w-full divide-y divide-neutral-200">
        <thead className="bg-neutral-50">
          <tr>
            {headers.map((header) => (
              <th
                key={header}
                className="px-4 py-3 text-left text-sm font-semibold text-neutral-700"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>

        <tbody className="divide-y divide-neutral-100 bg-white">
          {children}
        </tbody>
      </table>
    </div>
  )
}
