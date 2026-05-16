import Link from "next/link"

export default function HomePage() {
  return (
    <main className="p-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold mb-3">
          Accounting Platform
        </h1>

        <p className="text-slate-400 mb-10">
          Professionelle Buchhaltung und Finanzverwaltung
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard"
            className="rounded-xl border border-slate-800 p-6 hover:border-blue-500 transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              Dashboard
            </h2>

            <p className="text-slate-400 text-sm">
              Finanzübersicht und KPIs
            </p>
          </Link>

          <Link
            href="/journal"
            className="rounded-xl border border-slate-800 p-6 hover:border-blue-500 transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              Journal
            </h2>

            <p className="text-slate-400 text-sm">
              Buchungen und Journaleinträge
            </p>
          </Link>

          <Link
            href="/accounts"
            className="rounded-xl border border-slate-800 p-6 hover:border-blue-500 transition"
          >
            <h2 className="text-xl font-semibold mb-2">
              Kontenplan
            </h2>

            <p className="text-slate-400 text-sm">
              Verwaltung aller Sachkonten
            </p>
          </Link>
        </div>
      </div>
    </main>
  )
}
