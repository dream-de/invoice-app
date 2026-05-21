"use client"

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
import { translateStatus, useLanguage } from "@/lib/i18n"

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
  Entwurf: "bg-slate-50 text-slate-700 ring-slate-100",
  Überfällig: "bg-red-50 text-red-700 ring-red-100"
}

export default function CustomerDetailPage({
  params
}: CustomerDetailPageProps) {
  const { t } = useLanguage()
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

  const customerStatusLabel = (status: string) => {
    if (status === "Aktiv" || status === "active") return t("customers.status.active")
    if (status === "Offen" || status === "open") return t("customers.status.open")
    if (status === "Inaktiv" || status === "inactive") return t("customers.status.inactive")
    return status
  }

  const documentTypeLabel = (type: string) => {
    if (type === "Rechnung") return t("customers.detail.documentTypes.invoice")
    if (type === "Angebot") return t("customers.detail.documentTypes.offer")
    return type
  }

  return (
    <PageShell
      title={customer.name}
      description={t("customers.detail.description")}
    >
      <div className="mb-2 flex flex-wrap items-center gap-3">
        <Link
          href="/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          {t("customers.detail.actions.back")}
        </Link>

        <Link
          href="/documents/new"
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-black text-white no-underline shadow-sm hover:bg-blue-700"
        >
          {t("customers.detail.actions.newInvoice")}
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={t("customers.detail.stats.documents.label")}
          value={customerDocuments.length}
          helper={t("customers.detail.stats.documents.helper")}
          tone="blue"
        />

        <StatCard
          label={t("customers.detail.stats.paid.label")}
          value={paidDocuments.length}
          helper={t("customers.detail.stats.paid.helper")}
          tone="green"
        />

        <StatCard
          label={t("customers.detail.stats.open.label")}
          value={<Currency value={openAmount} />}
          helper={t("customers.detail.stats.open.helper")}
          tone="orange"
        />

        <StatCard
          label={t("customers.detail.stats.volume.label")}
          value={<Currency value={totalAmount} />}
          helper={t("customers.detail.stats.volume.helper")}
          tone="slate"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <div className="space-y-6">
          <ContentCard>
            <div className="flex flex-col justify-between gap-5 border-b border-slate-100 pb-6 md:flex-row md:items-start">
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("customers.detail.customer.eyebrow")}
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
                {customerStatusLabel(customer.status)}
              </span>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("customers.detail.fields.contact")}
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customer.contact}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("customers.detail.fields.email")}
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customer.email}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("customers.detail.fields.customerNumber")}
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  KD-{customer.id.padStart(4, "0")}
                </p>
              </div>

              <div className="rounded-[22px] bg-slate-50 p-5">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                  {t("customers.detail.fields.status")}
                </p>
                <p className="mt-2 text-lg font-black text-slate-950">
                  {customerStatusLabel(customer.status)}
                </p>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title={t("customers.detail.documents.title")}
            description={t("customers.detail.documents.description")}
          >
            <div className="overflow-hidden rounded-[26px] border border-slate-200">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  <tr>
                    <th className="px-5 py-4">{t("customers.detail.documents.table.number")}</th>
                    <th className="px-5 py-4">{t("customers.detail.documents.table.type")}</th>
                    <th className="px-5 py-4">{t("customers.detail.documents.table.status")}</th>
                    <th className="px-5 py-4 text-right">{t("customers.detail.documents.table.amount")}</th>
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
                          {documentTypeLabel(document.type)}
                        </span>
                      </td>

                      <td className="px-5 py-5">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                            documentStatusClass[document.status] ?? "bg-slate-50 text-slate-700 ring-slate-100"
                          }`}
                        >
                          {translateStatus(document.status, t)}
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
                        {t("customers.detail.documents.empty")}
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
            title={t("customers.detail.finance.title")}
            description={t("customers.detail.finance.description")}
          >
            <div className="rounded-[24px] bg-blue-600 p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-blue-100">
                {t("customers.detail.finance.totalVolume")}
              </p>
              <p className="mt-3 text-3xl font-black">
                <Currency value={totalAmount} />
              </p>
              <p className="mt-2 text-sm font-semibold text-blue-100">
                {t("customers.detail.finance.calculatedFromDocuments")}
              </p>
            </div>

            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">{t("customers.detail.finance.open")}</span>
                <span className="font-black text-slate-950">
                  <Currency value={openAmount} />
                </span>
              </div>

              <Divider />

              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-500">{t("customers.detail.finance.documents")}</span>
                <span className="font-black text-slate-950">
                  {customerDocuments.length}
                </span>
              </div>
            </div>
          </ContentCard>

          <ContentCard
            title={t("customers.detail.quickActions.title")}
            description={t("customers.detail.quickActions.description")}
          >
            <div className="space-y-3">
              <Link href="/documents/new" className="block no-underline">
                <Button className="w-full">
                  {t("customers.detail.quickActions.newInvoice")}
                </Button>
              </Link>

              <Link href="/documents/new" className="block no-underline">
                <Button variant="secondary" className="w-full">
                  {t("customers.detail.quickActions.newOffer")}
                </Button>
              </Link>

              <Link href="/customers/new" className="block no-underline">
                <Button variant="secondary" className="w-full">
                  {t("customers.detail.quickActions.editCustomer")}
                </Button>
              </Link>
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
