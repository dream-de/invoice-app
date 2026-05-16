import Link from "next/link"
import {
  Button,
  ContentCard,
  Currency,
  Divider,
  PageShell,
  StatCard
} from "@invoice-platform/ui"

import {
  customers,
  documents
} from "@/data/invoice-data"

type CustomerDetailPageProps = {
  params: {
    id: string
  }
}

const statusClass: Record<string, string> = {
  Aktiv: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Offen: "bg-orange-50 text-orange-700 ring-orange-100",
  Inaktiv: "bg-slate-50 text-slate-700 ring-slate-100"
}

const documentStatusClass: Record<string, string> = {
  Bezahlt: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Offen: "bg-orange-50 text-orange-700 ring-orange-100",
  Überfällig: "bg-red-50 text-red-700 ring-red-100"
}

export default function CustomerDetailPage({
  params
}: CustomerDetailPageProps) {
  const customer =
    customers.find((item) => item.id === params.id) ??
    customers[0]

  const customerDocuments = documents.filter(
    (document) => document.customer === customer.name
  )

  const totalAmount = customerDocuments.reduce(
    (sum, document) => sum + document.amount,
    0
  )

  const openAmount = customerDocuments
    .filter((document) => document.status === "Offen")
    .reduce((sum, document) => sum + document.amount, 0)

  const paidDocuments = customerDocuments.filter(
    (document) => document.status === "Bezahlt"
  )

  return (
    <PageShell
      title={customer.name}
      description="Kundenprofil, Rechnungen, Kontaktinformationen und Umsatzübersicht."
    >
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Link
          href="/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Zurück zu Kunden
        </Link>

        <Link
          href="/documents/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white no-underline shadow-sm hover:bg-blue-700"
        >
          Neue Rechnung
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Dokumente"
          value={customerDocuments.length}
          helper="Für diesen Kunden"
          tone="blue"
        />

        <StatCard
          label="Bezahlt"
          value={paidDocuments.length}
          helper="Abgeschlossen"
          tone="green"
        />

        <StatCard
          label="Offen"
          value={<Currency value={openAmount} />}
          helper="Noch ausstehend"
          tone="orange"
        />

        <StatCard
          label="Volumen"
          value={<Currency value={totalAmount} />}
          helper="Gesamtumsatz"
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-6">
          <ContentCard>
            <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Kunde
                </p>
                <h2 className="mt-2 text-3xl font-black text-slate-950">
                  {customer.name}
                </h2>
                <p className="mt-2 text-sm font-semibold text-slate-500">
                  {customer.contact} · {customer.email}
                </p>
              </div>

              <span
                className={`inline-flex rounded-full px-4 py-2 text-xs font-black ring-1 ${
                  statusClass[customer.status] ?? "bg-slate-50 text-slate-700 ring-slate-100"
                }`}
              >
                {customer.status}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Ansprechpartner
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customer.contact}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  E-Mail
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customer.email}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Kundennummer
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  KD-{customer.id.padStart(4, "0")}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  Status
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customer.status}
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title="Dokumente"
            description="Rechnungen und Angebote dieses Kunden."
          >
            <div className="overflow-hidden rounded-[26px] border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-5 py-4">Nummer</th>
                    <th className="px-5 py-4">Typ</th>
                    <th className="px-5 py-4">Status</th>
                    <th className="px-5 py-4 text-right">Betrag</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {customerDocuments.map((document) => (
                    <tr
                      key={document.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-5">
                        <Link
                          href={`/documents/${document.id}`}
                          className="font-black text-slate-950 no-underline hover:text-blue-700"
                        >
                          {document.number}
                        </Link>
                      </td>

                      <td className="px-5 py-5">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {document.type}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            documentStatusClass[document.status] ?? "bg-slate-50 text-slate-700 ring-slate-100"
                          }`}
                        >
                          {document.status}
                        </span>
                      </td>

                      <td className="px-5 py-5 text-right font-black text-slate-950">
                        <Currency value={document.amount} />
                      </td>
                    </tr>
                  ))}

                  {customerDocuments.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-5 py-10 text-center text-sm font-semibold text-slate-500"
                      >
                        Keine Dokumente für diesen Kunden vorhanden.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </ContentCard>
        </div>

        <div className="space-y-6">
          <ContentCard
            title="Finanzen"
            description="Kundenumsatz."
          >
            <div className="rounded-[24px] bg-blue-600 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                Gesamtvolumen
              </p>
              <p className="mt-3 text-3xl font-black">
                <Currency value={totalAmount} />
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                Aus Dokumenten berechnet
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Offen</span>
                <span className="font-black text-slate-950">
                  <Currency value={openAmount} />
                </span>
              </div>

              <Divider />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">Dokumente</span>
                <span className="font-black text-slate-950">
                  {customerDocuments.length}
                </span>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title="Aktionen"
            description="Kundenbezogene Schnellaktionen."
          >
            <div className="space-y-3">
              <Link href="/documents/new" className="block no-underline">
                <Button className="w-full">
                  Neue Rechnung
                </Button>
              </Link>

              <Link href="/documents/new" className="block no-underline">
                <Button variant="secondary" className="w-full">
                  Neues Angebot
                </Button>
              </Link>

              <Link href="/customers/new" className="block no-underline">
                <Button variant="secondary" className="w-full">
                  Kunde bearbeiten
                </Button>
              </Link>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
