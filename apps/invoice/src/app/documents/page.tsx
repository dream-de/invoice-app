"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Button, Currency, PageShell } from "@invoice-platform/ui"
import { documents } from "@/data/invoice-data"

const statusClass: Record<string, string> = {
  Bezahlt: "border-emerald-300 text-emerald-700",
  Offen: "border-slate-300 text-slate-700",
  Überfällig: "border-red-300 text-red-700",
  Entwurf: "border-slate-300 text-slate-600"
}

export default function DocumentsPage() {
  const [status, setStatus] = useState("Alle")
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => status === "Alle" || doc.status === status)
  }, [status])

  const allVisibleIds = filteredDocuments.map((d) => d.id)
  const allVisibleSelected =
    allVisibleIds.length > 0 &&
    allVisibleIds.every((id) => selectedIds.includes(id))

  const toggleOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const selectAllVisible = () => {
    setSelectedIds((prev) => {
      const merged = new Set([...prev, ...allVisibleIds])
      return [...merged]
    })
  }

  const clearSelection = () => setSelectedIds([])
  const clearVisible = () =>
    setSelectedIds((prev) => prev.filter((id) => !allVisibleIds.includes(id)))

  const exportSelected = () => {
    alert(`Export: ${selectedIds.length} Dokument(e)`)
  }

  const printSelected = () => {
    alert(`Drucken: ${selectedIds.length} Dokument(e)`)
  }

  const deleteSelected = () => {
    alert(`Löschen: ${selectedIds.length} Dokument(e)`)
  }

  return (
    <PageShell title="Rechnungen" description="">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-center gap-2">
          {["Alle", "Offen", "Bezahlt", "Überfällig"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setStatus(item)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition ${
                status === item
                  ? "bg-black text-white shadow"
                  : "bg-[#eceff3] text-[#6b7280] hover:bg-[#e3e8ef]"
              }`}
            >
              {item}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link href="/documents/templates" className="no-underline">
            <Button variant="secondary">Vorlagen</Button>
          </Link>

          <Button variant="secondary">Abos</Button>

          <Link href="/documents/new" className="no-underline">
            <button
              type="button"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-lime)] text-4xl font-semibold text-black shadow-sm transition hover:brightness-95"
            >
              +
            </button>
          </Link>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="mt-5 rounded-full bg-black px-6 py-5 text-white shadow-xl">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[var(--brand-lime)] font-semibold text-black">
                {selectedIds.length}
              </span>
              <p className="text-2xl font-semibold">
                Auswahl aktiv <span className="text-slate-400 text-lg">(Rechnungen)</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={allVisibleSelected ? clearVisible : selectAllVisible}
                className="rounded-full bg-[#171a1f] px-6 py-3 text-xl font-semibold text-white ring-1 ring-white/15"
              >
                {allVisibleSelected ? "Aufheben" : "Alle auswählen"}
              </button>

              <button
                type="button"
                onClick={clearSelection}
                className="rounded-full bg-[#171a1f] px-6 py-3 text-xl font-semibold text-white ring-1 ring-white/15"
              >
                Auswahl löschen
              </button>

              <span className="mx-1 hidden h-10 w-px bg-white/20 xl:block" />

              <button
                type="button"
                onClick={exportSelected}
                className="rounded-full bg-white px-6 py-3 text-xl font-semibold text-black"
              >
                ⤓ Export
              </button>

              <button
                type="button"
                onClick={printSelected}
                className="rounded-full bg-[var(--brand-lime)] px-6 py-3 text-xl font-semibold text-black"
              >
                ⎙ Drucken
              </button>

              <button
                type="button"
                onClick={deleteSelected}
                className="rounded-full bg-[#ef2b2b] px-6 py-3 text-xl font-semibold text-white"
              >
                🗑 Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {filteredDocuments.map((doc) => {
          const selected = selectedIds.includes(doc.id)

          return (
            <div
              key={doc.id}
              className={`grid grid-cols-[56px_1.1fr_0.8fr_0.7fr_0.9fr_0.8fr] items-center rounded-[28px] border bg-white px-5 py-3 shadow-sm transition ${
                selected
                  ? "border-black ring-1 ring-black"
                  : "border-[#e6ebf1] hover:border-[#cfd8e5]"
              }`}
            >
              <div>
                <button
                  type="button"
                  onClick={() => toggleOne(doc.id)}
                  className={`h-8 w-8 rounded-md border text-sm font-semibold ${
                    selected
                      ? "border-black bg-black text-[var(--brand-lime)]"
                      : "border-slate-300 bg-white text-transparent"
                  }`}
                >
                  ✓
                </button>
              </div>

              <Link href={`/documents/${doc.id}`} className="no-underline">
                <div>
                  <p className="text-[18px] font-semibold text-[#0f172a]">{doc.number}</p>
                  <p className="mt-1 text-sm text-[#64748b]">{doc.customer}</p>
                </div>
              </Link>

              <div className="text-sm font-semibold text-[#64748b]">{doc.type}</div>

              <div>
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                    statusClass[doc.status] ?? "border-slate-300 text-slate-700"
                  }`}
                >
                  {doc.status}
                </span>
              </div>

              <div className="text-right text-sm font-semibold text-[#64748b]">
                Fällig
                <p className="text-sm font-bold text-[#0f172a]">
                  {(doc as any).dueDate ?? (doc as any).createdAt ?? "-"}
                </p>
              </div>

              <div className="text-right text-[22px] font-medium text-[#0f172a]">
                <Currency value={doc.amount} />
              </div>
            </div>
          )
        })}
      </div>
    </PageShell>
  )
}
