"use client"

import { useMemo, useState } from "react"
import { Input, PageShell } from "@invoice-platform/ui"
import { projects } from "@/data/invoice-data"

export default function ProjectsPage() {
    const [showArchived, setShowArchived] = useState(false)
  const [query, setQuery] = useState("")
  const [editOpen, setEditOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return projects.filter((p) =>
      [p.name, p.customer, p.status, String((p as any).code ?? "")].join(" ").toLowerCase().includes(q)
    )
  }, [query])

  return (
    <PageShell
      title="Projekte"
      description="Projekte strukturieren alle Dokumente (Rechnungen/Angebote) pro Kunde."
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-[560px] max-w-full">
          
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-[#475569]">
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
            />
            Archiviert anzeigen
          </label>

          <button
            onClick={() => setEditOpen(true)}
            className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95"
          >
            + Neues Projekt
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eaf0] bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-[#f4f7fb] text-left text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            <tr>
              <th className="px-5 py-4">Projekt</th>
              <th className="px-5 py-4">Kunde</th>
              <th className="px-5 py-4">Status</th>
              <th className="px-5 py-4">Start</th>
              <th className="px-5 py-4 text-right">Aktionen</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-[#edf2f7]">
                <td className="px-5 py-4">
                  <p className="font-extrabold text-[#0f172a]">{p.name}</p>
                  {(p as any).code ? <p className="text-sm text-[#64748b]">{(p as any).code}</p> : null}
                </td>

                <td className="px-5 py-4 font-semibold text-[#334155]">{p.customer}</td>

                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                    p.status === "Aktiv" ? "bg-emerald-50 text-emerald-700" :
                    p.status === "Abgeschlossen" ? "bg-slate-100 text-slate-700" :
                    p.status === "Review" ? "bg-orange-50 text-orange-700" :
                    p.status === "Planung" ? "bg-blue-50 text-blue-700" :
                    "bg-slate-100 text-slate-600"
                  }`}>
                    {p.status}
                  </span>
                </td>

                <td className="px-5 py-4 font-semibold text-[#475569]">
                  {(p as any).startDate ?? (p as any).start ?? "-"}
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-2">
                    <button
                      onClick={() => setEditOpen(true)}
                      className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-[#1f2937] hover:bg-[#e5ebf2]"
                    >
                      Bearbeiten
                    </button>
                    <button className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-[#1f2937] hover:bg-[#e5ebf2]">
                      Archivieren
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 p-6">
          <div className="w-full max-w-[760px] overflow-hidden rounded-[34px] border border-[#dfe6ee] bg-[#f8f9fb] shadow-[0_20px_60px_rgba(0,0,0,0.28)]">
            <div className="flex items-start justify-between border-b border-[#e6ebf1] px-6 py-5">
              <div>
                <h2 className="text-xl font-black text-[#1b2333]">Projekt bearbeiten</h2>
                <p className="mt-1 text-sm text-[#7b8799]">Änderungen werden im Audit-Log gespeichert.</p>
              </div>
              <button
                onClick={() => setEditOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2]"
              >
                ✕
              </button>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <Input placeholder="Kunde (Pflicht)" defaultValue="Musterfirma GmbH" />
              <Input placeholder="Status" defaultValue="Aktiv" />
              <Input placeholder="Projektcode" />
              <Input placeholder="Projektname (Pflicht)" defaultValue="Website Relaunch 2024" />
              <Input placeholder="Start" defaultValue="01.09.2023" />
              <Input placeholder="Ende (optional)" />
              <Input placeholder="Budget" defaultValue="15000" />
              <Input placeholder="Archiviert" defaultValue="Nein" />
              <div className="md:col-span-2">
                <textarea
                  className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm text-[#334155] outline-none"
                  rows={4}
                  placeholder="Beschreibung (optional)"
                  defaultValue="Kompletter Relaunch der Corporate Website."
                />
              </div>
              <div className="md:col-span-2">
                <textarea
                  className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm text-[#334155] outline-none"
                  rows={3}
                  placeholder="Grund (Pflicht)"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-[#e6ebf1] px-6 py-4">
              <button
                onClick={() => setEditOpen(false)}
                className="rounded-full bg-[#edf1f6] px-5 py-2.5 font-semibold text-[#334155]"
              >
                Abbrechen
              </button>
              <button className="rounded-full bg-black px-5 py-2.5 font-extrabold text-white">
                Speichern
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
