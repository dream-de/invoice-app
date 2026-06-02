import React from "react"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", ...props }: Props) {
  const generatedId = React.useId()
  const fieldId = props.id ?? generatedId
  const errorId = error ? fieldId + "-error" : undefined
  const describedBy = [props["aria-describedby"], errorId].filter(Boolean).join(" ") || undefined
  const invalid = props["aria-invalid"] ?? (error ? true : undefined)

  return (
    <div className="space-y-2">
      {label && (
        <label htmlFor={fieldId} className="block text-xs font-bold uppercase tracking-wide text-neutral-600">
          {label}
        </label>
      )}

      <input
        {...props}
        id={fieldId}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={`w-full rounded-xl border border-neutral-200 bg-[var(--bg-input)] px-4 py-3 text-base font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100 aria-invalid:border-red-300 aria-invalid:bg-red-50/40 aria-invalid:focus:ring-red-100 ${className}`}
      />

      {error && (
        <span id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
