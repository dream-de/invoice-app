import Link from "next/link"
import {
  Button,
  ContentCard,
  Currency,
  PageShell,
  StatCard
} from "@invoice-platform/ui"

import {
  articles,
  customers,
  documents,
  projects
} from "@/data/invoice-data"

const totalRevenue = documents.reduce((sum, d) => sum + d.amount, 0)
const openDocuments = documents.filter((d) => d.status === "Offen")
const paidDocuments = documents.filter((d) => d.status === "Bezahlt")
const overdueDocuments = documents.filter((d) => d.status === "Überfällig")
const taxPreview = totalRevenue * 0.19

const latestDocuments = documents.slice(0, 5)

const activity = [
  { title: "Neue Rechnung vorbereitet", text: "RE-2026-004 kann weiter bearbeitet werden.", time: "Heute" },
  { title: "Kunde aktualisiert", text: "Musterfirma GmbH wurde zuletzt angepasst.", time: "Gestern" },
  { title: "Projekt angelegt", text: "Website Relaunch wurde als aktiv markiert.", time: "Diese Woche" }
]

const revenueBars = [
  { label: "Jan", value: 36 },
  { label: "Feb", value: 52 },
  { label: "Mär", value: 44 },
  { label: "Apr", value: 68 },
  { label: "Mai", value: 74 },
  { label: "Jun", value: 58 },
  { label: "Jul", value: 82 },
  { label: "Aug", value: 63 }
]

export default function DashboardPage() {
  return (
    <PageShell
      title="Dashboard"
      description="Finanzen, Rechnungen, Kunden und aktuelle Aktivitäten auf einen Blick."
    >


      <div className="grid gap-6 xl:grid-cols-[1.55fr_1fr]">
              <ContentCard
        title="Umsatzübersicht"
        description="Premium Summary fuer Umsatz, Zahlung und Steuer."
            className="dashboard-revenue-card"
      >
        <div className="grid gap-5 xl:grid-cols-[1.45fr_0.9fr]">
          <div className="overflow-hidden rounded-[26px] bg-[#0f172a] p-4 text-white sm:rounded-[30px] sm:p-6 shadow-[0_18px_42px_rgba(15,23,42,0.22)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Aktueller Umsatz</p>
                <p className="mt-3 text-[28px] font-medium leading-none tracking-tight text-white sm:mt-4 sm:text-[34px]">
                  4.500 €
                </p>
                <p className="mt-2 max-w-md text-xs font-normal leading-relaxed text-slate-300 sm:mt-3 sm:text-sm">
                  Monat und Jahr im Blick, spaeter aus echten Rechnungsdaten.
                </p>
              </div>
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Stabil
              </span>
            </div>

            <div className="mt-3 rounded-[18px] border border-white/10 bg-white/[0.07] p-2.5 sm:mt-6 sm:rounded-[24px] sm:p-4">
              <svg viewBox="0 0 520 140" className="h-20 w-full sm:h-36" aria-hidden="true">
                <defs>
                  <linearGradient id="dashboardRevenueFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" stopOpacity="0.52" />
                    <stop offset="100%" stopColor="#dbeafe" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path
                  d="M16 108 C62 78 96 92 136 62 C184 26 220 88 266 52 C314 14 362 46 410 28 C454 12 482 26 504 10"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="5"
                  strokeLinecap="round"
                />
                <path
                  d="M16 108 C62 78 96 92 136 62 C184 26 220 88 266 52 C314 14 362 46 410 28 C454 12 482 26 504 10 L504 140 L16 140 Z"
                  fill="url(#dashboardRevenueFill)"
                />
                <circle cx="266" cy="52" r="6" fill="#f97316" stroke="#ffffff" strokeWidth="3" />
                <circle cx="504" cy="10" r="6" fill="#10b981" stroke="#ffffff" strokeWidth="3" />
              </svg>
            </div>
          </div>

          <div className="rounded-[26px] border border-[#e6ebf1] bg-[#f8fafc] p-4 shadow-[0_12px_28px_rgba(15,23,42,0.08)] sm:rounded-[30px] sm:p-5">
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-400">Statuswerte</p>

            <div className="mt-4 grid grid-cols-2 gap-2 sm:mt-5 sm:gap-3 xl:grid-cols-1">
              <div className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.18em] text-orange-500">Offen</p>
                    <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]">1.160 €</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.18em] text-emerald-600">Bezahlt</p>
                    <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]">890 €</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-blue-600" />
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.18em] text-blue-600">MwSt</p>
                    <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]">855 €</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[16px] border border-[#e6ebf1] bg-white px-3 py-2.5 sm:rounded-[18px] sm:px-4 sm:py-3 shadow-[0_8px_18px_rgba(15,23,42,0.05)]">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full bg-slate-950" />
                  <div>
                    <p className="text-[9px] font-medium uppercase tracking-[0.14em] sm:text-[10px] sm:tracking-[0.18em] text-slate-500">Dokumente</p>
                    <p className="mt-0.5 text-[15px] font-medium text-slate-950 sm:mt-1 sm:text-[18px]">4 aktiv</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ContentCard>

<ContentCard
            title="Schnellaktionen"
            description="Häufig verwendete Aktionen."
          >
            <div className="space-y-4">
              {[
                {
                  title: "Neue Rechnung erstellen",
                  description: "Rechnung direkt vorbereiten.",
                  meta: "Sofort"
                },
                {
                  title: "Neuen Kunden anlegen",
                  description: "Kontakt und Adresse erfassen.",
                  meta: "Stammdaten"
                },
                {
                  title: "Neues Projekt starten",
                  description: "Projektstruktur anlegen.",
                  meta: "Projekt"
                }
              ].map((action) => (
                <button
                  key={action.title}
                  className="w-full rounded-[20px] border border-[#e6ebf1] bg-[#f5f7fa] p-4 text-left shadow-[0_8px_20px_rgba(15,23,42,0.07)] transition hover:-translate-y-0.5 hover:bg-white hover:shadow-[0_14px_28px_rgba(15,23,42,0.11)]"
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="min-w-0">
                      <span className="block text-sm font-black text-slate-950">
                        {action.title}
                      </span>
                      <span className="mt-1 block text-xs font-medium leading-5 text-slate-500">
                        {action.description}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-400 ring-1 ring-[#e6ebf1]">
                      {action.meta}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </ContentCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.85fr]">
        <ContentCard title="Letzte Rechnungen" description="Aktuelle Dokumente mit Zahlungsstatus.">
          <div className="overflow-hidden rounded-[24px] border border-[#e5eaf0] bg-white">
            <table className="w-full">
              <thead className="bg-[#f3f6fa] text-left text-xs font-extrabold uppercase tracking-widest text-[#64748b]">
                <tr>
                  <th className="px-5 py-4">Dokument</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4 text-right">Betrag</th>
                </tr>
              </thead>
              <tbody>
                {latestDocuments.map((doc) => (
                  <tr key={doc.id} className="border-t border-[#edf2f7]">
                    <td className="px-5 py-4">
                      <Link href={`/documents/${doc.id}`} className="font-extrabold text-[#111827] no-underline hover:text-[#2563eb]">
                        {doc.number}
                      </Link>
                      <p className="mt-1 text-sm text-[#64748b]">{doc.customer}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        doc.status === "Bezahlt" ? "bg-emerald-50 text-emerald-700" :
                        doc.status === "Überfällig" ? "bg-red-50 text-red-700" :
                        "bg-orange-50 text-orange-700"
                      }`}>
                        {doc.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-[#111827]">
                      <Currency value={doc.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </ContentCard>

        <ContentCard title="Aktivitäten" description="Letzte Bewegungen im System.">
          <div className="space-y-4">
            {activity.map((item) => (
              <div key={item.title} className="rounded-[20px] border border-[#e6ebf1] bg-[#f5f7fa] p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-extrabold text-[#111827]">{item.title}</p>
                    <p className="mt-1 text-sm text-[#64748b]">{item.text}</p>
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#64748b] shadow-sm">
                    {item.time}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </ContentCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Kunden", customers.length, "/customers"],
          ["Projekte", projects.length, "/projects"],
          ["Artikel", articles.length, "/articles"],
          ["Überfällig", overdueDocuments.length, "/documents"]
        ].map(([label, value, href]) => (
          <Link
            key={label}
            href={href as string}
            className="rounded-[24px] border border-[#e4eaf1] bg-white p-6 no-underline shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#8a94a6]">{label}</p>
            <p className="mt-3 text-3xl font-extrabold text-[#111827]">{value}</p>
            <p className="mt-2 text-sm font-medium text-[#64748b]">Bereich öffnen</p>
          </Link>
        ))}
      </div>
    </PageShell>
  )
}
