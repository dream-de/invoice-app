"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Building2,
  Download,
  Mail,
  Pencil,
  Plus,
  Printer,
  Share2,
  Trash2
} from "lucide-react"
import { ContentCard, Currency, PageShell } from "@invoice-platform/ui"

import { documents } from "@/data/invoice-data"

type DocumentDetailPageProps = {
  params: {
    id: string
  }
}

type BankAccount = {
  id: string
  bank: string
  iban: string
  bic: string
}

export default function DocumentDetailPage({ params }: DocumentDetailPageProps) {
  const doc = documents.find((item) => item.id === params.id) ?? documents[0]

  const [showSendModal, setShowSendModal] = useState(false)
  const [sendTo, setSendTo] = useState("kunde@example.com")
  const [subject, setSubject] = useState(`Rechnung ${doc.number}`)
  const [message, setMessage] = useState(
    `Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Ihre Rechnung ${doc.number}.\n\nMit freundlichen Grüßen`
  )

  const [editingBankId, setEditingBankId] = useState<string | null>("main")
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([
    {
      id: "main",
      bank: "Hausbank",
      iban: "DE89 3704 0044 0532 0130 00",
      bic: "COBADEFFXXX"
    }
  ])

  const [newBank, setNewBank] = useState("")
  const [newIban, setNewIban] = useState("")
  const [newBic, setNewBic] = useState("")

  const amount = Number(doc.amount ?? 1160.25)
  const net = amount / 1.19
  const tax = amount - net

  function handleDownload() {
    const content = `Dokument ${doc.number}\nKunde: ${doc.customer}\nBetrag: ${amount.toFixed(2)} EUR`
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${doc.number}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function handleShare() {
    const shareText = `${doc.number} · ${doc.customer}`
    if (navigator.share) {
      await navigator.share({ title: doc.number, text: shareText })
      return
    }

    await navigator.clipboard.writeText(shareText)
    alert("Link/Text wurde kopiert.")
  }

  function updateBankAccount(id: string, field: keyof BankAccount, value: string) {
    setBankAccounts((items) =>
      items.map((item) => item.id === id ? { ...item, [field]: value } : item)
    )
  }

  function deleteBankAccount(id: string) {
    setBankAccounts((items) => items.filter((item) => item.id !== id))
    if (editingBankId === id) {
      setEditingBankId(null)
    }
  }

  function addBankAccount() {
    if (!newBank.trim() && !newIban.trim() && !newBic.trim()) return

    const id = `bank-${Date.now()}`
    setBankAccounts((items) => [
      ...items,
      {
        id,
        bank: newBank.trim() || "Neue Bank",
        iban: newIban.trim() || "IBAN eintragen",
        bic: newBic.trim() || "BIC eintragen"
      }
    ])

    setEditingBankId(id)
    setNewBank("")
    setNewIban("")
    setNewBic("")
  }

  const actionButton =
    "inline-flex min-h-10 items-center gap-2 rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-semibold text-[#1f2937] transition hover:bg-[#e5ebf2]"

  const iconButton =
    "inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#f3f6fa] text-slate-600 ring-1 ring-slate-200 transition hover:bg-white hover:text-slate-950"

  return (
    <PageShell title={doc.number} description={`${doc.type ?? "Rechnung"} · ${doc.customer}`}>
      <div className="space-y-6">
        <ContentCard>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link
                href="/documents"
                className="text-xs font-semibold uppercase tracking-widest text-slate-400 no-underline hover:text-slate-900"
              >
                Zurück zu Dokumenten
              </Link>

              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950">
                {doc.number}
              </h1>

              <p className="mt-2 text-base font-medium text-slate-500">
                {doc.customer}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/documents/${doc.id}/edit`} className={`${actionButton} no-underline`}>
                <Pencil className="h-4 w-4" />
                Bearbeiten
              </Link>
              <button type="button" onClick={() => setShowSendModal(true)} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-black px-4 py-2 text-sm font-semibold text-white">
                <Mail className="h-4 w-4" />
                E-Mail
              </button>
              <button type="button" onClick={() => window.print()} className={actionButton}>
                <Printer className="h-4 w-4" />
                Drucken
              </button>
              <button type="button" onClick={handleShare} className={actionButton}>
                <Share2 className="h-4 w-4" />
                Teilen
              </button>
              <button type="button" onClick={handleDownload} className="inline-flex min-h-10 items-center gap-2 rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-bold text-black">
                <Download className="h-4 w-4" />
                Download
              </button>
            </div>
          </div>
        </ContentCard>

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.85fr]">
          <div className="space-y-6">
            <ContentCard title="Dokumentdaten" description="Empfänger, Datum und Zahlungsinformationen.">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Empfänger</p>
                  <p className="mt-2 text-lg font-bold text-slate-900">{doc.customer}</p>
                </div>
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Datum</p>
                  <p className="mt-2 text-base font-bold text-slate-900">15.10.2023</p>
                </div>
                <div className="rounded-2xl bg-[#f7f9fc] p-4">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Fällig</p>
                  <p className="mt-2 text-base font-bold text-slate-900">29.10.2023</p>
                </div>
              </div>
            </ContentCard>

            <ContentCard title="Positionen" description="Leistungen und Beträge.">
              <div className="overflow-hidden rounded-2xl border border-[#e5eaf0] bg-white">
                <table className="w-full">
                  <thead className="bg-[#f7f9fc] text-left text-xs font-semibold uppercase tracking-widest text-slate-500">
                    <tr>
                      <th className="px-5 py-4">Beschreibung</th>
                      <th className="px-5 py-4 text-right">Betrag</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-[#edf2f7]">
                      <td className="px-5 py-5">
                        <p className="text-base font-bold text-slate-900">Projektleistung</p>
                        <p className="mt-1 text-sm text-slate-500">Abrechnung laut Dokument</p>
                      </td>
                      <td className="px-5 py-5 text-right text-base font-bold text-slate-900">
                        <Currency value={net} />
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-5 flex justify-end">
                <div className="w-full max-w-sm rounded-2xl bg-[#f7f9fc] p-5">
                  <div className="flex justify-between text-sm text-slate-500">
                    <span>Netto</span>
                    <span className="font-semibold text-slate-900"><Currency value={net} /></span>
                  </div>
                  <div className="mt-2 flex justify-between text-sm text-slate-500">
                    <span>MwSt 19%</span>
                    <span className="font-semibold text-slate-900"><Currency value={tax} /></span>
                  </div>
                  <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950">
                    <span>Gesamt</span>
                    <Currency value={amount} />
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>

          <div className="space-y-6">
            <ContentCard title="Status" description="Aktueller Dokumentstatus.">
              <span className="inline-flex rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                {doc.status ?? "Bezahlt"}
              </span>
            </ContentCard>

            <ContentCard title="Bankdaten" description="IBAN, BIC und Bankverbindung direkt bearbeiten.">
              <div className="space-y-3">
                {bankAccounts.map((account) => {
                  const isEditing = editingBankId === account.id

                  return (
                    <div key={account.id} className="rounded-2xl border border-[#e5eaf0] bg-white p-4">
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef2f7] text-slate-600">
                            <Building2 className="h-4 w-4" />
                          </span>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{account.bank}</p>
                            <p className="text-xs font-medium text-slate-400">Bankverbindung</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingBankId(isEditing ? null : account.id)}
                            className={`${iconButton} ${isEditing ? "bg-black text-white hover:bg-black hover:text-white" : ""}`}
                            aria-label="Bankdaten bearbeiten"
                            title="Bearbeiten"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => deleteBankAccount(account.id)}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 transition hover:bg-red-100"
                            aria-label="Bankdaten löschen"
                            title="Löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <input
                          value={account.bank}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "bank", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="Bankname"
                        />
                        <input
                          value={account.iban}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "iban", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="IBAN"
                        />
                        <input
                          value={account.bic}
                          readOnly={!isEditing}
                          onChange={(event) => updateBankAccount(account.id, "bic", event.target.value)}
                          className={`w-full rounded-full px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none transition ${
                            isEditing
                              ? "bg-[#f3f6fa] focus:ring-2 focus:ring-slate-900"
                              : "bg-[#f8fafc] text-slate-500"
                          }`}
                          aria-label="BIC"
                        />
                      </div>
                    </div>
                  )
                })}

                <div className="rounded-2xl border border-dashed border-[#d8e0ea] bg-[#f7f9fc] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">Neue Bankdaten</p>
                      <p className="text-xs font-medium text-slate-400">Bank, IBAN und BIC hinzufügen</p>
                    </div>

                    <button
                      type="button"
                      onClick={addBankAccount}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-sm transition hover:scale-105 hover:bg-slate-800"
                      aria-label="Bankdaten hinzufügen"
                      title="Hinzufügen"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <input value={newBank} onChange={(event) => setNewBank(event.target.value)} placeholder="Bank" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                    <input value={newIban} onChange={(event) => setNewIban(event.target.value)} placeholder="IBAN" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                    <input value={newBic} onChange={(event) => setNewBic(event.target.value)} placeholder="BIC" className="w-full rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 outline-none ring-1 ring-slate-200 focus:ring-2 focus:ring-slate-900" />
                  </div>
                </div>
              </div>
            </ContentCard>
          </div>
        </div>
      </div>

      {showSendModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-extrabold text-slate-900">Per E-Mail senden</h3>
                <p className="mt-1 text-sm text-slate-500">Nachricht prüfen und lokal senden.</p>
              </div>
              <button onClick={() => setShowSendModal(false)} className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                Schließen
              </button>
            </div>

            <div className="mt-6 space-y-3">
              <input value={sendTo} onChange={(event) => setSendTo(event.target.value)} className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="Empfänger" />
              <input value={subject} onChange={(event) => setSubject(event.target.value)} className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="Betreff" />
              <textarea value={message} onChange={(event) => setMessage(event.target.value)} className="min-h-40 w-full rounded-2xl border border-slate-200 px-5 py-4 text-sm outline-none focus:ring-2 focus:ring-slate-900" placeholder="Nachricht" />
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowSendModal(false)} className="rounded-full bg-slate-100 px-5 py-2.5 text-sm font-semibold text-slate-600">
                Abbrechen
              </button>
              <button
                onClick={() => {
                  alert("E-Mail-Versand wurde vorbereitet")
                  setShowSendModal(false)
                }}
                className="rounded-full bg-[var(--brand-lime)] px-6 py-2.5 text-sm font-bold text-black"
              >
                Senden
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  )
}
