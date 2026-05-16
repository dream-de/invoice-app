import type { ReactNode } from "react"
import { Topbar } from "./topbar"

type PageContainerProps = {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageContainer({
  title,
  description,
  actions,
  children
}: PageContainerProps) {
  return (
    <div>
      <Topbar title={title} actions={actions} />

      <main className="mx-auto max-w-6xl p-8">
        {description ? (
          <p className="mb-8 text-neutral-600">
            {description}
          </p>
        ) : null}

        {children}
      </main>
    </div>
  )
}
