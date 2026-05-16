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
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-extrabold uppercase tracking-[0.18em] text-neutral-500">
          {label}
        </label>
      )}

      <textarea
        {...props}
        className={`
          min-h-36
          w-full
          rounded-[1.75rem]
          border-0
          bg-neutral-50
          px-6
          py-5
          text-lg
          font-semibold
          text-neutral-900
          outline-none
          ring-1
          ring-transparent
          transition
          placeholder:text-neutral-400
          focus:bg-white
          focus:ring-2
          focus:ring-neutral-200
          ${className}
        `}
      />

      {error && (
        <span className="text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}
