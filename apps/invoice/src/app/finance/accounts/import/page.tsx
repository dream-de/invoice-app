import Link from "next/link"
import { ArrowLeft, FileUp, Upload } from "lucide-react"
import { PageShell } from "@invoice-platform/ui"

export default function CsvImportPage() {
  return (
    <PageShell title="CSV importieren" description="Importieren Sie Transaktionen aus Ihrer Bank.">
      <div className="space-y-6">
        <Link href="/finance/accounts" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </Link>

        <div className="grid gap-6 xl:grid-cols-[1fr_0.7fr]">
          <section className="rounded-3xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-600 ring-1 ring-gray-200">
              <FileUp className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-extrabold text-slate-950">CSV-Datei auswählen</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">Ziehen Sie eine Datei hierher oder wählen Sie eine CSV-Datei aus Ihrem Banking-Export.</p>
            <button className="mt-6 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-bold text-white">
              <Upload className="h-4 w-4" />
              Datei auswählen
            </button>
          </section>

          <section className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-gray-200">
            <h2 className="text-xl font-extrabold text-slate-950">Import-Einstellungen</h2>
            <div className="mt-5 space-y-4">
              <select className="h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-700 outline-none">
                <option>Hauptgeschäftskonto</option>
                <option>Steuerrücklagen</option>
                <option>PayPal Business</option>
              </select>
              <select className="h-12 w-full rounded-full bg-[#f3f6fa] px-5 text-sm font-semibold text-slate-700 outline-none">
                <option>Duplikate automatisch erkennen</option>
              </select>
              <button className="w-full rounded-full bg-[var(--brand-lime)] px-5 py-3 text-sm font-bold text-black">Import starten</button>
            </div>
          </section>
        </div>
      </div>
    </PageShell>
  )
}
