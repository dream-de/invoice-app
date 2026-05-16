import type { ReactNode } from "react"

type BadgeProps = {
  children: ReactNode
}

export function Badge({ children }: BadgeProps) {
  return (
    <span className="inline-flex rounded-full border border-neutral-300 px-2.5 py-1 text-xs font-medium">
      {children}
    </span>
  )
}
