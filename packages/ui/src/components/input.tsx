import React from "react"

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export function Input({ label, error, className = "", ...props }: Props) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wide text-neutral-600">
          {label}
        </label>
      )}

      <input
        {...props}
        className={`w-full rounded-[999px] border border-neutral-200 bg-[var(--bg-input)] px-4 py-3 text-base font-medium text-neutral-900 outline-none transition placeholder:text-neutral-400 focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100 ${className}`}
      />

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
