import type { ReactNode } from "react"
import { designTokens } from "../styles/design-tokens"

type FormFieldProps = {
  label?: string
  error?: string
  children: ReactNode
}

export function FormField({ label, error, children }: FormFieldProps) {
  return (
    <div className="space-y-1">
      {label && (
        <label className={designTokens.text.label}>
          {label}
        </label>
      )}

      {children}

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
