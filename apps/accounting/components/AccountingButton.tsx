import type { ButtonHTMLAttributes, ReactNode } from "react"

type AccountingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
}

export function AccountingButton({
  children,
  className = "",
  ...props
}: AccountingButtonProps) {
  return (
    <button
      className={`rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-500 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
