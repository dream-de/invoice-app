"use client"

import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react"
import { useState } from "react"
import { Check, Download, RotateCcw, Trash2 } from "lucide-react"

export function SettingCard({
  title,
  description,
  children
}: {
  title?: string
  description?: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[26px] border border-[#e5eaf0] bg-white p-6 shadow-sm">
      {(title || description) && (
        <div className="mb-5">
          {title ? <h3 className="text-lg font-extrabold text-[#1f2937]">{title}</h3> : null}
          {description ? <p className="mt-1 text-sm font-medium text-[#64748b]">{description}</p> : null}
        </div>
      )}
      {children}
    </section>
  )
}

export function Field({
  label,
  children
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
        {label}
      </span>
      {children}
    </label>
  )
}

export function SoftInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`h-12 w-full rounded-full border border-[#e1e7ef] bg-[#f7f9fc] px-5 text-sm font-semibold text-[#1f2937] outline-none transition placeholder:text-[#94a3b8] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 ${props.className ?? ""}`}
    />
  )
}

export function SoftTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-[22px] border border-[#e1e7ef] bg-[#f7f9fc] px-5 py-4 text-sm font-medium leading-6 text-[#1f2937] outline-none transition placeholder:text-[#94a3b8] focus:border-black focus:bg-white focus:ring-2 focus:ring-black/10 ${props.className ?? ""}`}
    />
  )
}

export function ToggleRow({
  title,
  description,
  defaultChecked = false
}: {
  title: string
  description: string
  defaultChecked?: boolean
}) {
  const [checked, setChecked] = useState(defaultChecked)

  return (
    <button
      type="button"
      onClick={() => setChecked(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[22px] border border-[#edf2f7] bg-[#f8fafc] p-4 text-left transition hover:bg-white"
    >
      <span>
        <span className="block font-extrabold text-[#111827]">{title}</span>
        <span className="mt-1 block text-sm font-medium text-[#64748b]">{description}</span>
      </span>

      <span className={`flex h-8 w-14 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-black" : "bg-[#dfe6ee]"}`}>
        <span className={`h-6 w-6 rounded-full bg-white transition ${checked ? "translate-x-6" : ""}`} />
      </span>
    </button>
  )
}

export function ChoiceButtons({
  options,
  defaultValue
}: {
  options: string[]
  defaultValue: string
}) {
  const [value, setValue] = useState(defaultValue)

  return (
    <div className="inline-flex flex-wrap gap-2 rounded-full bg-[#eceff3] p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setValue(option)}
          className={`rounded-full px-5 py-2 text-sm font-extrabold transition ${
            value === option ? "bg-white text-[#111827] shadow-sm" : "text-[#64748b] hover:text-[#111827]"
          }`}
        >
          {option}
        </button>
      ))}
    </div>
  )
}

export function IconButton({
  kind = "neutral",
  children
}: {
  kind?: "neutral" | "danger" | "success"
  children: ReactNode
}) {
  const styles = {
    neutral: "bg-[#eef2f7] text-[#334155] hover:bg-[#e5ebf2]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-black text-[var(--brand-lime)]"
  }

  return (
    <button className={`inline-flex h-10 items-center gap-2 rounded-full px-4 text-sm font-extrabold transition ${styles[kind]}`}>
      {children}
    </button>
  )
}

export { Check, Download, RotateCcw, Trash2 }
