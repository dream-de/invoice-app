import React from "react"

type Option = {
  label: string
  value: string
}

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  options: Option[]
  error?: string
}

export function Select({
  label,
  options,
  error,
  className = "",
  ...props
}: SelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wide text-neutral-600">
          {label}
        </label>
      )}

      <select
        {...props}
        className={`w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-base font-medium text-neutral-900 outline-none transition focus:border-neutral-300 focus:ring-2 focus:ring-neutral-100 ${className}`}
      >
        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
