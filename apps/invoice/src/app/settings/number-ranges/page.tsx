"use client"

import { FileDigit } from "lucide-react"
import { useEffect, useMemo, useState } from "react"
import { Field, SoftInput } from "../_components/SettingsControls"
import { SettingsLayout } from "../_components/SettingsLayout"

type RangeForm = {
  type: string
  title: string
  prefix: string
  nextValue: string
  padding: number
}

const defaults: RangeForm[] = [
  { type: "invoice", title: "Rechnungen", prefix: "RE-%Y-", nextValue: "104", padding: 3 },
  { type: "offer", title: "Angebote", prefix: "AN-%Y-", nextValue: "42", padding: 3 },
  { type: "customer", title: "Kunden", prefix: "KD-", nextValue: "4", padding: 4 }
]

function makePreview(prefix: string, next: string, padding: number) {
  const year = "2026"
  const cleanNext = String(Number(next) || 1).padStart(padding, "0")

  return `${prefix.replace("%Y", year)}${cleanNext}`
}

function NumberBlock({
  range,
  update
}: {
  range: RangeForm
  update: (type: string, patch: Partial<RangeForm>) => void
}) {
  const preview = useMemo(
    () => makePreview(range.prefix, range.nextValue, range.padding),
    [range.prefix, range.nextValue, range.padding]
  )

  return (
    <section className="rounded-[30px] border border-[#e5eaf0] bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eef2f7] text-[#475569]">
            <FileDigit className="h-3.5 w-3.5" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-[#1f2937]">{range.title}</h3>
            <span className="mt-1.5 inline-flex rounded-full bg-[#eef2f7] px-3 py-1 text-[11px] font-extrabold uppercase text-[#64748b]">
              Vorschau: {preview}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Präfix Format">
          <SoftInput value={range.prefix} onChange={(event) => update(range.type, { prefix: event.target.value })} />
        </Field>

        <Field label="Nächste Nummer">
          <SoftInput value={range.nextValue} onChange={(event) => update(range.type, { nextValue: event.target.value })} />
        </Field>
      </div>

      <div className="mt-4 rounded-[26px] bg-[#f8fafc] p-3.5 ring-1 ring-[#e5eaf0]">
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
              Mindestlänge (Padding)
            </p>
            <p className="mt-1 text-sm font-medium text-[#94a3b8]">
              {range.padding} Stellen, z.B. {String(1).padStart(range.padding, "0")}
            </p>
          </div>

          <span className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-[#111827] shadow-sm">
            {range.padding}
          </span>
        </div>

        <input
          type="range"
          min={1}
          max={8}
          value={range.padding}
          onChange={(event) => update(range.type, { padding: Number(event.target.value) })}
          className="w-full accent-black"
        />

        <div className="mt-2 flex justify-between text-[11px] font-bold text-[#94a3b8]">
          <span>1</span>
          <span>3 Stellen</span>
          <span>6</span>
          <span>8</span>
        </div>
      </div>
    </section>
  )
}

export default function NumberRangesSettingsPage() {
  const [ranges, setRanges] = useState<RangeForm[]>(defaults)
  const [status, setStatus] = useState("")

  useEffect(() => {
    async function loadRanges() {
      const response = await fetch("/api/settings/number-ranges", { cache: "no-store" })
      const result = await response.json()

      if (!result.ok) return

      setRanges(
        defaults.map((item) => {
          const found = result.ranges.find((range: any) => range.type === item.type)
          if (!found) return item

          return {
            ...item,
            prefix: found.prefix,
            nextValue: String(found.nextValue),
            padding: Number(found.padding)
          }
        })
      )
    }

    loadRanges()
  }, [])

  function update(type: string, patch: Partial<RangeForm>) {
    setRanges((items) =>
      items.map((item) => item.type === type ? { ...item, ...patch } : item)
    )
  }

  async function save() {
    setStatus("Speichert...")

    const response = await fetch("/api/settings/number-ranges", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ranges: ranges.map((range) => ({
          type: range.type,
          prefix: range.prefix,
          nextValue: Number(range.nextValue) || 1,
          padding: range.padding
        }))
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      setStatus(result.error || "Speichern fehlgeschlagen.")
      return
    }

    setStatus("Gespeichert.")
  }

  return (
    <SettingsLayout
      title="Nummernkreise"
      description="Definieren Sie das Format für Rechnungs-, Angebots- und Kundennummern."
      action={save}
      status={status}
    >
      {ranges.map((range) => (
        <NumberBlock key={range.type} range={range} update={update} />
      ))}
    </SettingsLayout>
  )
}
