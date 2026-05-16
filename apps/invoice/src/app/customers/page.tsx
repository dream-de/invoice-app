"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Input, PageShell } from "@invoice-platform/ui"
import { customers } from "@/data/invoice-data"

export default function CustomersPage() {
    const [view, setView] = useState<"grid" | "list">("grid")
  const [query, setQuery] = useState("")

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return customers.filter((c) =>
      [c.name, c.contact, c.email, c.status].join(" ").toLowerCase().includes(q)
    )
  }, [query])

  return (
    <PageShell
      title="Kunden"
      description="Kundenübersicht, Kontakte und Status auf einen Blick."
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-[360px] max-w-full">
          
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex rounded-full bg-[#eceff3] p-1">
            <button onClick={() => setView("grid")} className={`rounded-full px-4 py-2 text-sm font-extrabold ${view === "grid" ? "bg-white shadow text-[#111827]" : "text-[#6b7280]"}`}>⊞</button>
            <button onClick={() => setView("list")} className={`rounded-full px-4 py-2 text-sm font-extrabold ${view === "list" ? "bg-white shadow text-[#111827]" : "text-[#6b7280]"}`}>☰</button>
          </div>

          <Link href="/customers/new" className="no-underline">
            <button className="flex h-14 w-14 items-center justify-center rounded-full bg-black text-4xl font-black text-white shadow-sm transition hover:brightness-95">+</button>
          </Link>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="no-underline">
              <div className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#edf2f7] text-lg font-extrabold text-[#334155]">
                    {c.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className="rounded-full bg-[#f3f6fa] px-2 py-1 text-xs text-[#64748b]">↗</span>
                </div>

                <h3 className="text-2xl font-extrabold text-[#0f172a]">{c.name}</h3>
                <p className="mt-1 text-sm text-[#64748b]">{c.contact}</p>

                <div className="mt-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {c.status}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <Link key={c.id} href={`/customers/${c.id}`} className="block no-underline">
              <div className="grid grid-cols-[1.3fr_1fr_0.7fr_0.3fr] items-center rounded-full border border-[#e5eaf0] bg-white px-6 py-4 shadow-sm transition hover:border-[#cfd8e5] hover:shadow">
                <div>
                  <p className="font-extrabold text-[#111827]">{c.name}</p>
                  <p className="text-sm text-[#64748b]">{c.contact}</p>
                </div>
                <div className="text-sm text-[#64748b]">{c.email}</div>
                <div>
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${c.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                    {c.status}
                  </span>
                </div>
                <div className="text-right text-sm font-extrabold text-[#64748b]">↗</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="rounded-[20px] border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-8 text-center text-[#64748b]">
          Keine Kunden gefunden.
        </div>
      )}
    </PageShell>
  )
}
