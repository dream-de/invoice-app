import type { ReactNode } from "react"

type AlertVariant = "info" | "success" | "warning" | "error"

type AlertProps = {
  title: string
  children?: ReactNode
  variant?: AlertVariant
}

const variants: Record<AlertVariant, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-900",
  success: "border-green-200 bg-green-50 text-green-900",
  warning: "border-yellow-200 bg-yellow-50 text-yellow-900",
  error: "border-red-200 bg-red-50 text-red-900"
}

export function Alert({
  title,
  children,
  variant = "info"
}: AlertProps) {
  return (
    <div className={`rounded-xl border p-4 ${variants[variant]}`}>
      <p className="font-semibold">{title}</p>

      {children ? (
        <div className="mt-1 text-sm">
          {children}
        </div>
      ) : null}
    </div>
  )
}
