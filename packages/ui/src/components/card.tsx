import type { ReactNode } from "react"

type CardProps = {
  title?: string
  children: ReactNode
}

export function Card({ title, children }: CardProps) {
  return (
    <div className="invoice-card-3d-soft rounded-[26px] border border-[#e5eaf0] bg-white p-6">
      {title ? (
        <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      ) : null}

      {children}
    </div>
  )
}
