"use client"

import type { ReactNode } from "react"

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
  widthClassName = "max-w-[760px]"
}: AppModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-6">
      <div className={`w-full ${widthClassName} overflow-hidden rounded-[34px] border border-[#dfe6ee] bg-[#f8f9fb] shadow-[0_20px_60px_rgba(0,0,0,0.28)]`}>
        <div className="flex items-start justify-between border-b border-[#e6ebf1] px-6 py-5">
          <div>
            <h2 className="text-4 font-black text-[#1b2333]">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-[#7b8799]">{subtitle}</p> : null}
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2]"
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
