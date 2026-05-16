import type { ReactNode } from "react"

type PageShellProps = {
  title: string
  description?: string
  children: ReactNode
}

export function PageShell({
  title,
  description,
  children
}: PageShellProps) {
  return (
    <div className="invoice-shell-3d rounded-[36px] border border-[#e3e9f1] bg-[#f8f9fb] p-5 sm:p-7 lg:p-9">
      <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end lg:mb-8">
        <div>
          <h1 className="text-[32px] font-semibold leading-tight text-[#1d2433] sm:text-[34px] lg:text-[38px]">
            {title}
          </h1>

          {description && (
            <p className="mt-3 max-w-3xl text-base font-medium leading-[1.45] text-[#5f6f88] sm:text-lg lg:text-[20px]">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-6">{children}</div>
    </div>
  )
}
