import type { ReactNode } from "react"

type ContentCardProps = {
  title?: string
  description?: string
  children: ReactNode
  className?: string
}

export function ContentCard({
  title,
  description,
  children,
  className = ""
}: ContentCardProps) {
  return (
    <section className={`invoice-card-3d rounded-[30px] border border-[#e5eaf0] bg-white p-4 sm:p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            {title && (
              <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                {title}
              </h2>
            )}

            {description && (
              <p className="mt-1 text-xs font-medium text-slate-500">
                {description}
              </p>
            )}
          </div>
        </div>
      )}

      {children}
    </section>
  )
}
