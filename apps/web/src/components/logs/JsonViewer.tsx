"use client"

import { Check, ChevronDown, Copy } from "lucide-react"
import { useMemo, useState } from "react"
import { safeStringify } from "@/lib/logs/logFormatter"

export interface JsonViewerProps {
  value: unknown
  title?: string
  defaultOpen?: boolean
  maxHeight?: string
}

export function JsonViewer({ value, title = "JSON", defaultOpen = false, maxHeight = "20rem" }: JsonViewerProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [copied, setCopied] = useState(false)
  const json = useMemo(() => safeStringify(value ?? {}, 2), [value])

  async function copyJson() {
    try {
      await navigator.clipboard.writeText(json)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="min-w-0 max-w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="flex min-w-0 items-center justify-between gap-3 px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="inline-flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-slate-800"
        >
          <ChevronDown size={16} className={`shrink-0 transition ${open ? "rotate-180" : ""}`} />
          <span className="truncate">{title}</span>
        </button>

        <button
          type="button"
          onClick={() => void copyJson()}
          className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
          {copied ? "Kopiert" : "Kopieren"}
        </button>
      </div>

      {open ? (
        <pre
          className="max-w-full overflow-auto border-t border-slate-200 bg-slate-950 p-4 font-mono text-xs leading-5 text-slate-100"
          style={{ maxHeight }}
        >
          {json || "{}"}
        </pre>
      ) : null}
    </section>
  )
}

export default JsonViewer
