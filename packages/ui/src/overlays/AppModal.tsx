"use client"

import { useId, type ReactNode } from "react"

type AppModalProps = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}

export function AppModal({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClassName = "max-w-[calc(100vw-2rem)] md:max-w-[760px]"
}: AppModalProps) {
  const titleId = useId()
  const subtitleId = useId()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-4 md:p-6">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle ? subtitleId : undefined}
        className={`w-full ${widthClassName} overflow-hidden rounded-[24px] border border-[#dfe6ee] bg-[#f8f9fb] shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#e6ebf1] px-6 py-5">
          <div>
            <h2 id={titleId} className="text-4 font-black text-[#1b2333]">{title}</h2>
            {subtitle ? <p id={subtitleId} className="mt-1 text-sm text-[#7b8799]">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            aria-label="Dialog schliessen"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            ✕
          </button>
        </div>

        <div className="max-h-[68vh] overflow-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="border-t border-[#e6ebf1] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
