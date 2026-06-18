import Link from "next/link"
import type { ReactNode } from "react"
import { legacySettingsNav } from "@/lib/settings-nav"

export function SettingsShell({
  active,
  title,
  description,
  children
}: {
  active: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[36px] bg-white shadow-sm ring-1 ring-slate-200">
      <div className="grid min-h-[980px] lg:grid-cols-[360px_1fr]">
        <aside className="border-r border-slate-100 bg-slate-50/70 px-10 py-10">
          <h1 className="text-3xl font-black tracking-tight text-slate-950">Einstellungen</h1>
          <nav className="mt-10 space-y-5">
            {legacySettingsNav.map((item) => {
              const isActive = active === item.href
              const Icon = item.icon
              return (
                <Link key={item.href} href={item.href} className={`flex items-center gap-5 rounded-[28px] p-4 no-underline transition ${isActive ? "bg-white text-slate-950 shadow-md ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/70 hover:text-slate-900"}`}>
                  <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${isActive ? "bg-black text-lime-300" : "bg-slate-200 text-slate-500"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="block text-lg font-black">{item.title}</span>
                    <span className="mt-1 block text-xs font-bold text-slate-400">{item.description}</span>
                  </span>
                </Link>
              )
            })}
          </nav>
          <div className="mt-8 rounded-[28px] bg-lime-100 p-5 text-sm font-semibold text-slate-800 ring-1 ring-lime-200">Alle Änderungen wirken sich auf neue Dokumente aus.</div>
        </aside>
        <section className="bg-white">
          <div className="border-b border-slate-100 px-12 py-10">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-slate-400">Invoice Einstellungen</p>
            <h2 className="mt-3 text-3xl font-black text-slate-950">{title}</h2>
            <p className="mt-2 max-w-3xl text-base font-medium text-slate-500">{description}</p>
          </div>
          <div className="px-12 py-10">{children}</div>
        </section>
      </div>
    </div>
  )
}
