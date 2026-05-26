import { designTokens } from "@dream-invoice/ui"
import type { ReactNode } from "react"

type AccountingContentCardProps = {
  title: string
  description?: string
  children: ReactNode
}

export function AccountingContentCard({
  title,
  description,
  children
}: AccountingContentCardProps) {
  return (
    <div className={designTokens.utility.u4df3cc14e1}>
      <div className={designTokens.utility.u0f5f4577d5}>
        <h2 className={designTokens.utility.u8588407212}>{title}</h2>
        {description ? (
          <p className={designTokens.utility.ufdc10ac346}>{description}</p>
        ) : null}
      </div>

      <div className={designTokens.utility.u0478c89a15}>
        {children}
      </div>
    </div>
  )
}
