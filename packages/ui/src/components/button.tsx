import type { ButtonHTMLAttributes, ReactNode } from "react"

type ButtonVariant = "primary" | "secondary"

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant
  children: ReactNode
}

export function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  const base =
    "inline-flex min-h-11 items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"

  const variants = {
    primary: "bg-[var(--brand-dark)] text-white hover:bg-neutral-800",
    secondary: "border border-neutral-300 bg-white text-neutral-900 hover:bg-neutral-50"
  }

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
