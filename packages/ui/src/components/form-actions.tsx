import type { ReactNode } from "react"

type FormActionsProps = {
  children: ReactNode
}

export function FormActions({ children }: FormActionsProps) {
  return (
    <div className="mt-6 flex items-center justify-end gap-3 border-t border-neutral-200 pt-6">
      {children}
    </div>
  )
}
