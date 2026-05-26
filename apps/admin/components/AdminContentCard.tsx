import { designTokens } from "@dream-invoice/ui"
import type { ReactNode } from "react"

type AdminContentCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AdminContentCard({
  title,
  description,
  children
}: AdminContentCardProps) {
  return (
    <div className={designTokens.utility.ua6f5030e4b}>
      <div className={designTokens.utility.u5b6a20fe28}>
        <h2 className={designTokens.utility.u8588407212}>{title}</h2>

        {description ? (
          <p className={designTokens.utility.u0203ed6078}>
            {description}
          </p>
        ) : null}
      </div>

      <div className={designTokens.utility.u0478c89a15}>
        {children}
      </div>
    </div>
  )
}
