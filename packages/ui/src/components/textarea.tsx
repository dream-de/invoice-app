import React from "react"

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
}

export function Textarea({
  label,
  error,
  className = "",
  ...props
}: TextareaProps) {
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

      <textarea
        {...props}
        id={fieldId}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        className={`min-h-36 w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100 aria-invalid:border-red-300 aria-invalid:bg-red-50/40 aria-invalid:focus:ring-red-100 ${className}`}
      />

      {error && (
        <span id={errorId} className="text-xs font-medium text-red-600">
          {error}
        </span>
      )}
    </div>
  )
}
