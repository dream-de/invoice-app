import type { CSSProperties, ReactNode } from "react"

type PageShellProps = {
  title: string
  description?: string
  children: ReactNode
  className?: string
  hideHeader?: boolean
  style?: CSSProperties
}

export function PageShell({
  title,
  description,
  children,
  className,
  hideHeader = false,
  style
}: PageShellProps) {
  return (
    <div className={["invoice-shell-3d rounded-[36px] border border-[#e3e9f1] bg-[#f8f9fb] p-5 sm:p-7 lg:p-9", className].filter(Boolean).join(" ")} style={style}>
      {!hideHeader && (
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-8">
          <div>
            <h1 className="text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#111827] sm:text-[34px] lg:text-[34px]">
              {title}
            </h1>

            {description && (
              <p className="mt-3 max-w-3xl text-base font-semibold leading-[1.45] text-[#64748b] sm:text-[17px] lg:text-lg">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="space-y-6">{children}</div>
    </div>
  )
}
