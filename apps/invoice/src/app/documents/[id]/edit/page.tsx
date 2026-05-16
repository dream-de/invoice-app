"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Check, FileUp, Plus, Sparkles, Trash2, X } from "lucide-react"
import { Button, ContentCard, Currency, Input, PageShell, Select, Textarea } from "@invoice-platform/ui"
import { documents } from "@/data/invoice-data"

type DocumentEditPageProps = {
  params: {
    id: string
  }
}

type Position = {
  id: string
  label: string
  qty: number
  price: number
  category: string
}

type RecipientImport = {
  company: string
  contact: string
  email: string
  street: string
  zip: string
  city: string
  country: string
  vatId: string
}

export default function DocumentEditPage({ params }: DocumentEditPageProps) {
  const document = documents.find((item) => item.id === params.id) ?? documents[0]

  const [number, setNumber] = useState(document.number)
  const [customer, setCustomer] = useState(document.customer)
  const [project, setProject] = useState("(Kein Projekt)")
  const [date, setDate] = useState("2026-05-14")
  const [serviceDate, setServiceDate] = useState("2026-05-14")
  const [dueDate, setDueDate] = useState("2026-05-28")
  const [email, setEmail] = useState("buchhaltung@musterfirma.de")
  const [address, setAddress] = useState("Musterstraße 123\n12345 Musterstadt")
  const [intro, setIntro] = useState("Vielen Dank für Ihren Auftrag. Wir berechnen Ihnen folgende Leistungen:")

  const [positions, setPositions] = useState<Position[]>([
    { id: "pos-1", label: "Webdesign Entwurf", qty: 1, price: 851, category: "(Keine)" },
    { id: "pos-2", label: "Frontend Entwicklung", qty: 5, price: 80, category: "(Keine)" }
  ])

  const [recipientImportOpen, setRecipientImportOpen] = useState(false)
  const [recipientImportStep, setRecipientImportStep] = useState<"upload" | "preview">("upload")
  const [recipientFileName, setRecipientFileName] = useState("")
  const [recognizedRecipient, setRecognizedRecipient] = useState<RecipientImport>({
    company: "",
    contact: "",
    email: "",
    street: "",
    zip: "",
    city: "",
    country: "Deutschland",
    vatId: ""
  })

  const net = useMemo(
    () => positions.reduce((sum, item) => sum + Number(item.qty || 0) * Number(item.price || 0), 0),
    [positions]
  )
  const tax = net * 0.19
  const gross = net + tax

  function updatePosition(id: string, field: keyof Position, value: string) {
    setPositions((items) =>
      items.map((item) => {
        if (item.id !== id) return item

        if (field === "qty" || field === "price") {
          return { ...item, [field]: Number(String(value).replace(",", ".")) || 0 }
        }

        return { ...item, [field]: value }
      })
    )
  }

  function addPosition() {
    setPositions((items) => [
      ...items,
      {
        id: `pos-${Date.now()}`,
        label: "Neue Position",
        qty: 1,
        price: 0,
        category: "(Keine)"
      }
    ])
  }

  function deletePosition(id: string) {
    setPositions((items) => items.filter((item) => item.id !== id))
  }

  async function recognizeRecipientFile(file: File) {
    setRecipientFileName(file.name)

    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch("/api/import/recipient", {
      method: "POST",
      body: formData
    })

    const result = await response.json()

    if (!response.ok || !result.ok || !result.recipient) {
      alert(result.warnings?.[0] || result.error || "Empfänger konnte nicht erkannt werden.")
      return
    }

    setRecognizedRecipient({
      company: result.recipient.company || "",
      contact: result.recipient.contact || "",
      email: result.recipient.email || "",
      street: result.recipient.street || "",
      zip: result.recipient.zip || "",
      city: result.recipient.city || "",
      country: result.recipient.country || "Deutschland",
      vatId: result.recipient.vatId || ""
    })

    setRecipientImportStep("preview")
  }

  function updateRecognizedRecipient(field: keyof RecipientImport, value: string) {
    setRecognizedRecipient((current) => ({ ...current, [field]: value }))
  }

  function applyRecognizedRecipient() {
    setCustomer(recognizedRecipient.company || customer)
    setEmail(recognizedRecipient.email || email)
    setAddress(
      [
        recognizedRecipient.street,
        [recognizedRecipient.zip, recognizedRecipient.city].filter(Boolean).join(" "),
        recognizedRecipient.country
      ].filter(Boolean).join("\n")
    )

    setRecipientImportOpen(false)
    setRecipientImportStep("upload")
    setRecipientFileName("")
  }

  return (
    <PageShell title="Rechnung bearbeiten" description={`${number} · Änderungen direkt mit Live-Vorschau prüfen.`}>
      <div className="mb-3">
        <Link href={`/documents/${document.id}`} className="text-xs font-bold text-slate-500 no-underline hover:text-slate-900">
          Zurück zum Dokument
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.82fr_1.45fr]">
        <div className="space-y-5">
          <ContentCard title="Basisdaten" description="Nummer, Datum, Empfänger und Projekt bearbeiten.">
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Rechnungs-Nr." value={number} onChange={(event) => setNumber(event.target.value)} />
              <Input label="Datum" value={date} onChange={(event) => setDate(event.target.value)} />
              <Input label="Leistungsdatum" value={serviceDate} onChange={(event) => setServiceDate(event.target.value)} />
              <Input label="Fälligkeit" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />

              <Select
                label="Empfänger"
                value={customer}
                onChange={(event) => setCustomer(event.target.value)}
                options={[
                  { value: "Muster GmbH", label: "Muster GmbH" },
                  { value: "Musterfirma GmbH", label: "Musterfirma GmbH" },
                  { value: "Beispiel AG", label: "Beispiel AG" },
                  { value: "Nord Solutions", label: "Nord Solutions" }
                ]}
              />

              <Input label="Projekt" value={project} onChange={(event) => setProject(event.target.value)} />
              <Input label="Firmenname / Kunde" value={customer} onChange={(event) => setCustomer(event.target.value)} />
              <Input label="E-Mail" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <div className="mt-4">
              <Textarea label="Adresse optional" value={address} onChange={(event) => setAddress(event.target.value)} />
            </div>

            <button
              type="button"
              onClick={() => setRecipientImportOpen(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-black px-5 py-2.5 text-sm font-extrabold text-[var(--brand-lime)]"
            >
              <FileUp className="h-4 w-4" />
              Empfänger importieren
            </button>
          </ContentCard>

          <ContentCard title="Positionen" description="Artikel, Mengen und Preise bearbeiten.">
            <div className="mb-4 flex justify-end">
              <button
                type="button"
                onClick={addPosition}
                className="inline-flex items-center gap-2 rounded-full bg-[var(--brand-lime)] px-4 py-2 text-sm font-extrabold text-black"
              >
                <Plus className="h-4 w-4" />
                Artikel
              </button>
            </div>

            <div className="space-y-4">
              {positions.map((item) => (
                <div key={item.id} className="rounded-[22px] border border-[#e5eaf0] bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <Input value={item.label} onChange={(event) => updatePosition(item.id, "label", event.target.value)} placeholder="Position" />

                    <button
                      type="button"
                      onClick={() => deletePosition(item.id)}
                      className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                      aria-label="Position löschen"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 grid gap-3 md:grid-cols-4">
                    <Input label="Menge" value={String(item.qty)} onChange={(event) => updatePosition(item.id, "qty", event.target.value)} />
                    <Input label="Einzel (€)" value={String(item.price)} onChange={(event) => updatePosition(item.id, "price", event.target.value)} />
                    <Input label="Kategorie" value={item.category} onChange={(event) => updatePosition(item.id, "category", event.target.value)} />
                    <div className="rounded-[18px] bg-[#f7f9fc] px-4 py-3">
                      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Gesamt</p>
                      <p className="mt-2 font-extrabold text-slate-950">
                        <Currency value={item.qty * item.price} />
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[22px] bg-[#f7f9fc] p-5">
              <div className="flex justify-between text-sm text-slate-500">
                <span>Netto</span>
                <span className="font-bold text-slate-900"><Currency value={net} /></span>
              </div>
              <div className="mt-2 flex justify-between text-sm text-slate-500">
                <span>MwSt (19%)</span>
                <span className="font-bold text-slate-900"><Currency value={tax} /></span>
              </div>
              <div className="mt-4 flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950">
                <span>Gesamtbetrag</span>
                <Currency value={gross} />
              </div>
            </div>
          </ContentCard>

          <ContentCard title="Nachricht" description="Einleitung für das Dokument.">
            <Textarea label="Text" value={intro} onChange={(event) => setIntro(event.target.value)} />
          </ContentCard>

          <Button className="w-full">Änderungen speichern</Button>
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
          <ContentCard title="Live Vorschau" description="DIN A4 Ansicht wie im finalen Dokument.">
            <div className="overflow-auto rounded-[24px] bg-[#e9edf3] p-5">
              <div className="mx-auto min-h-[1040px] w-full max-w-[794px] rounded-[8px] bg-white px-14 py-12 shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest text-slate-400">Empfänger</p>
                    <h3 className="mt-3 text-2xl font-extrabold text-slate-950">{customer}</h3>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">{address}</p>
                    <p className="mt-2 text-sm text-slate-500">{email}</p>
                  </div>

                  <div className="text-right text-sm leading-6 text-slate-600">
                    <p><span className="font-bold text-slate-950">Rechnung:</span> {number}</p>
                    <p><span className="font-bold text-slate-950">Datum:</span> {date}</p>
                    <p><span className="font-bold text-slate-950">Leistung:</span> {serviceDate}</p>
                    <p><span className="font-bold text-slate-950">Fällig:</span> {dueDate}</p>
                  </div>
                </div>

                <h4 className="mt-16 text-3xl font-extrabold tracking-tight text-slate-950">
                  Rechnung {number}
                </h4>

                <p className="mt-5 text-sm leading-7 text-slate-700">{intro}</p>

                <div className="mt-8 overflow-hidden rounded-[18px] border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-widest text-slate-500">
                      <tr>
                        <th className="px-4 py-3">Position</th>
                        <th className="px-4 py-3 text-right">Menge</th>
                        <th className="px-4 py-3 text-right">Einzel</th>
                        <th className="px-4 py-3 text-right">Gesamt</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {positions.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-4 font-semibold text-slate-900">{item.label}</td>
                          <td className="px-4 py-4 text-right text-slate-600">{item.qty}</td>
                          <td className="px-4 py-4 text-right text-slate-600"><Currency value={item.price} /></td>
                          <td className="px-4 py-4 text-right font-bold text-slate-950"><Currency value={item.price * item.qty} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-10 ml-auto max-w-[280px] space-y-3 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Netto</span>
                    <span className="font-bold text-slate-950"><Currency value={net} /></span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>MwSt (19%)</span>
                    <span className="font-bold text-slate-950"><Currency value={tax} /></span>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-4 text-lg font-extrabold text-slate-950">
                    <span>Gesamt</span>
                    <Currency value={gross} />
                  </div>
                </div>
              </div>
            </div>
          </ContentCard>
        </div>
      </div>

      {recipientImportOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-3xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold text-[#111827]">Empfänger importieren</h2>
                <p className="mt-1 text-sm font-medium text-[#64748b]">
                  Firmenanschrift erkennen, prüfen, korrigieren und übernehmen.
                </p>
              </div>

              <button
                onClick={() => setRecipientImportOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]"
                aria-label="Schließen"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {recipientImportStep === "upload" ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#cfd8e5] bg-[#f8fafc] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]">
                  <Sparkles className="h-8 w-8" />
                </div>

                <h3 className="mt-5 text-xl font-extrabold text-[#111827]">
                  PDF, Word, Bild oder Scan hochladen
                </h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#64748b]">
                  Es werden nur Empfänger-Felder erkannt. Positionen, Preise und deine eigene Firma bleiben unverändert.
                </p>

                <label className="mt-6 inline-flex cursor-pointer rounded-full bg-black px-6 py-3 text-sm font-extrabold text-white hover:bg-slate-800">
                  Datei auswählen
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) recognizeRecipientFile(file)
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-4 rounded-[20px] bg-[#f8fafc] px-5 py-4">
                  <p className="text-sm font-bold text-[#111827]">Erkannte Datei: {recipientFileName}</p>
                  <p className="mt-1 text-sm font-medium text-[#64748b]">
                    Bitte prüfen. Erst nach „Empfänger übernehmen“ wird die Rechnung geändert.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <Input label="Firmenname" value={recognizedRecipient.company} onChange={(event) => updateRecognizedRecipient("company", event.target.value)} />
                  <Input label="Ansprechpartner optional" value={recognizedRecipient.contact} onChange={(event) => updateRecognizedRecipient("contact", event.target.value)} />
                  <Input label="E-Mail" value={recognizedRecipient.email} onChange={(event) => updateRecognizedRecipient("email", event.target.value)} />
                  <Input label="USt-IdNr. optional" value={recognizedRecipient.vatId} onChange={(event) => updateRecognizedRecipient("vatId", event.target.value)} />
                  <Input label="Straße" value={recognizedRecipient.street} onChange={(event) => updateRecognizedRecipient("street", event.target.value)} />
                  <Input label="PLZ" value={recognizedRecipient.zip} onChange={(event) => updateRecognizedRecipient("zip", event.target.value)} />
                  <Input label="Ort" value={recognizedRecipient.city} onChange={(event) => updateRecognizedRecipient("city", event.target.value)} />
                  <Input label="Land" value={recognizedRecipient.country} onChange={(event) => updateRecognizedRecipient("country", event.target.value)} />
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setRecipientImportStep("upload")}
                    className="rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-bold text-[#334155]"
                  >
                    Zurück
                  </button>
                  <button
                    onClick={applyRecognizedRecipient}
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-extrabold text-[var(--brand-lime)]"
                  >
                    <Check className="h-4 w-4" />
                    Empfänger übernehmen
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </PageShell>
  )
}
