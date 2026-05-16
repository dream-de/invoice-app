"use client"

import type { ReactNode } from "react"

type AppSidePanelProps = {
  open: boolean
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  widthClassName?: string
}

export function AppSidePanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
  widthClassName = "w-[430px]"
}: AppSidePanelProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/35">
      <div className={`h-full ${widthClassName} border-l border-[#dfe6ee] bg-[#f8f9fb] shadow-[-10px_0_35px_rgba(0,0,0,0.16)]`}>
        <div className="flex items-start justify-between border-b border-[#e6ebf1] px-6 py-5">
          <div>
            <h2 className="text-xl font-black text-[#1b2333]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#7b8799]">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2]"
          >
            ✕
          </button>
        </div>

        <div className="h-[calc(100%-148px)] overflow-auto px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="h-[88px] border-t border-[#e6ebf1] px-6 py-4">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
