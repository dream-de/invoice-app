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
    <section className="rounded-lg border border-[var(--settings-line)] bg-[var(--settings-surface)] p-4 shadow-[var(--settings-card-shadow)] sm:p-5">
      {(title || description) && (
        <div className="mb-4">
          {title ? <h3 className="text-[15px] font-extrabold text-[var(--settings-title)]">{title}</h3> : null}
          {description ? <p className="mt-1 text-[13px] font-medium leading-5 text-[var(--settings-muted)]">{description}</p> : null}
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
      <span className="mb-1.5 block text-[11px] font-extrabold uppercase text-[var(--settings-label)]">
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
      className={`h-10 w-full rounded-lg border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-3 text-sm font-semibold text-[var(--settings-title)] outline-none shadow-[var(--settings-input-shadow)] transition placeholder:text-[var(--settings-placeholder)] focus:border-[var(--settings-accent)] focus:bg-[var(--settings-input-focus-bg)] focus:ring-2 focus:ring-[var(--settings-accent-soft)] ${props.className ?? ""}`}
    />
  )
}

export function SoftTextarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full rounded-lg border border-[var(--settings-input-border)] bg-[var(--settings-input-bg)] px-3 py-3 text-sm font-medium leading-6 text-[var(--settings-title)] outline-none shadow-[var(--settings-input-shadow)] transition placeholder:text-[var(--settings-placeholder)] focus:border-[var(--settings-accent)] focus:bg-[var(--settings-input-focus-bg)] focus:ring-2 focus:ring-[var(--settings-accent-soft)] ${props.className ?? ""}`}
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
      className="flex w-full items-center justify-between gap-4 rounded-lg border border-[var(--settings-line)] bg-[var(--settings-subtle)] p-3 text-left transition hover:bg-[var(--settings-surface)]"
    >
      <span>
        <span className="block text-sm font-extrabold text-[var(--settings-title)]">{title}</span>
        <span className="mt-1 block text-[13px] font-medium leading-5 text-[var(--settings-muted)]">{description}</span>
      </span>

      <span className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition ${checked ? "bg-emerald-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),0_4px_8px_rgba(16,185,129,0.16)]" : "bg-[var(--settings-toggle-off)]"}`}>
        <span className={`h-5 w-5 rounded-full bg-white transition ${checked ? "translate-x-5" : ""}`} />
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
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-[var(--settings-subtle)] p-1">
      {options.map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => setValue(option)}
          className={`rounded-md px-3 py-1.5 text-xs font-extrabold transition ${
            value === option ? "bg-[var(--settings-surface)] text-[var(--settings-title)] shadow-sm" : "text-[var(--settings-muted)] hover:text-[var(--settings-title)]"
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
    neutral: "bg-[var(--settings-subtle)] text-[var(--settings-title)] hover:bg-[var(--settings-surface)]",
    danger: "bg-red-50 text-red-600 hover:bg-red-100",
    success: "bg-[var(--settings-accent-strong)] text-white hover:opacity-95"
  }

  return (
    <button className={`inline-flex h-9 items-center gap-2 rounded-lg px-3 text-sm font-extrabold transition ${styles[kind]}`}>
      {children}
    </button>
  )
}

export { Check, Download, RotateCcw, Trash2 }
