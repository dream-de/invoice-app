import type { ReactNode } from "react"

type StatCardProps = {
  label: string
  value: ReactNode
  helper?: string
  tone?: "blue" | "green" | "orange" | "red" | "slate"
}

const toneMap = {
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  orange: "bg-orange-50 text-orange-700 ring-orange-100",
  red: "bg-red-50 text-red-700 ring-red-100",
  slate: "bg-slate-50 text-slate-700 ring-slate-100"
}

export function StatCard({
  label,
  value,
  helper,
  tone = "slate"
}: StatCardProps) {
  return (
    <div className="invoice-card-3d invoice-card-3d-hover rounded-[30px] border border-[#e5eaf0] bg-white p-6 transition duration-200 hover:-translate-y-1 hover:border-[#d7e0ea]">
      <div className={`mb-4 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-widest ring-1 ${toneMap[tone]}`}>
        {label}
      </div>

      <div className="text-[26px] font-medium tracking-tight text-slate-950">
        {value}
      </div>

      {helper ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">
          {helper}
        </p>
      ) : null}
    </div>
  )
}
