"use client"

import { useMemo, useState } from "react"
import { Input, PageShell } from "@dream-invoice/ui"
import { projects } from "@/data/invoice-data"
import { useLanguage } from "@/lib/i18n"

export default function ProjectsPage() {
  const [showArchived, setShowArchived] = useState(false)
  const [query, setQuery] = useState("")
  const [editOpen, setEditOpen] = useState(false)
  const { t } = useLanguage()

  const filtered = useMemo(() => {
    const q = query.toLowerCase()
    return projects.filter((project) =>
      [project.name, project.customer, project.status, String((project as any).code ?? "")]
        .join(" ")
        .toLowerCase()
        .includes(q)
    )
  }, [query])

  const projectStatus = (status: string) => {
    if (status === "Aktiv" || status === "active") return t("projects.status.active")
    if (status === "Abgeschlossen" || status === "completed") return t("projects.status.completed")
    if (status === "Planung" || status === "planning") return t("projects.status.planning")
    if (status === "Review" || status === "review") return t("projects.status.review")
    return status
  }

  return (
    <PageShell title={t("projects.overview.title")} description={t("projects.overview.description")}>
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="w-[560px] max-w-full" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="inline-flex items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-[#475569]">
            <input type="checkbox" checked={showArchived} onChange={(event) => setShowArchived(event.target.checked)} />
            {t("projects.overview.showArchived")}
          </label>
          <button onClick={() => setEditOpen(true)} className="rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white shadow-sm transition hover:brightness-95">
            + {t("projects.overview.newProject")}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[24px] border border-[#e5eaf0] bg-white shadow-sm">
        <table className="w-full">
          <thead className="bg-[#f4f7fb] text-left text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
            <tr>
              <th className="px-5 py-4">{t("projects.overview.table.project")}</th>
              <th className="px-5 py-4">{t("projects.overview.table.customer")}</th>
              <th className="px-5 py-4">{t("projects.overview.table.status")}</th>
              <th className="px-5 py-4">{t("projects.overview.table.start")}</th>
              <th className="px-5 py-4 text-right">{t("projects.overview.table.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((project) => (
              <tr key={project.id} className="border-t border-[#edf2f7]">
                <td className="px-5 py-4">
                  <p className="font-extrabold text-[#0f172a]">{project.name}</p>
                  {(project as any).code ? <p className="text-sm text-[#64748b]">{(project as any).code}</p> : null}
                </td>
                <td className="px-5 py-4 font-semibold text-[#334155]">{project.customer}</td>
                <td className="px-5 py-4">
                  <span className={`rounded-full px-3 py-1 text-xs font-extrabold ${project.status === "Aktiv" ? "bg-emerald-50 text-emerald-700" : project.status === "Abgeschlossen" ? "bg-slate-100 text-slate-700" : project.status === "Review" ? "bg-orange-50 text-orange-700" : project.status === "Planung" ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {projectStatus(project.status)}
                  </span>
                </td>
                <td className="px-5 py-4 font-semibold text-[#475569]">{(project as any).startDate ?? (project as any).start ?? "-"}</td>
                <td className="px-5 py-4 text-right">
                  <div className="inline-flex gap-2">
                    <button onClick={() => setEditOpen(true)} className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-[#1f2937] hover:bg-[#e5ebf2]">
                      {t("projects.overview.actions.edit")}
                    </button>
                    <button className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-extrabold text-[#1f2937] hover:bg-[#e5ebf2]">
                      {t("projects.overview.actions.archive")}
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
                <h2 className="text-xl font-black text-[#1b2333]">{t("projects.modal.title")}</h2>
                <p className="mt-1 text-sm text-[#7b8799]">{t("projects.modal.description")}</p>
              </div>
              <button onClick={() => setEditOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-lg text-slate-700 hover:bg-[#e4eaf2]" aria-label={t("projects.modal.close")}>
                x
              </button>
            </div>
            <div className="grid gap-4 px-6 py-5 md:grid-cols-2">
              <Input placeholder={t("projects.modal.fields.customer")} defaultValue="Aurora Labs GmbH" />
              <Input placeholder={t("projects.modal.fields.status")} defaultValue={t("projects.status.active")} />
              <Input placeholder={t("projects.modal.fields.code")} />
              <Input placeholder={t("projects.modal.fields.name")} defaultValue="Portal Relaunch 2026" />
              <Input placeholder={t("projects.modal.fields.start")} defaultValue="01.09.2023" />
              <Input placeholder={t("projects.modal.fields.end")} />
              <Input placeholder={t("projects.modal.fields.budget")} defaultValue="15000" />
              <Input placeholder={t("projects.modal.fields.archived")} defaultValue={t("projects.modal.no")} />
              <div className="md:col-span-2">
                <textarea className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm text-[#334155] outline-none" rows={4} placeholder={t("projects.modal.fields.description")} defaultValue={t("projects.modal.defaultDescription")} />
              </div>
              <div className="md:col-span-2">
                <textarea className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm text-[#334155] outline-none" rows={3} placeholder={t("projects.modal.fields.reason")} />
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-[#e6ebf1] px-6 py-4">
              <button onClick={() => setEditOpen(false)} className="rounded-full bg-[#edf1f6] px-5 py-2.5 font-semibold text-[#334155]">
                {t("projects.actions.cancel")}
              </button>
              <button className="rounded-full bg-black px-5 py-2.5 font-extrabold text-white">
                {t("projects.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
