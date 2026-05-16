"use client"

import Link from "next/link"
import { useState } from "react"
import {
  Button,
  ContentCard,
  FormActions,
  Input,
  PageShell,
  Select
} from "@invoice-platform/ui"

type FormState = {
  name: string
  contact: string
  email: string
  phone: string
  number: string
  status: string
  street: string
  zip: string
  city: string
  country: string
}

const initialState: FormState = {
  name: "",
  contact: "",
  email: "",
  phone: "",
  number: "",
  status: "active",
  street: "",
  zip: "",
  city: "",
  country: "Deutschland"
}

export default function NewCustomerPage() {
  const [form, setForm] = useState<FormState>(initialState)
  const [status, setStatus] = useState<"idle" | "saving" | "success" | "error">("idle")
  const [message, setMessage] = useState("")

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value
    }))
    setStatus("idle")
    setMessage("")
  }

  async function createCustomer() {
    setStatus("saving")
    setMessage("")

    try {
      const response = await fetch("/api/customers/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(form)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Kunde konnte nicht erstellt werden.")
      }

      setStatus("success")
      setMessage(`Kunde wurde erstellt: ${result.customer?.name}`)
      setForm(initialState)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    }
  }

  return (
    <PageShell
      title="Neuer Kunde"
      description="Kundenprofil mit Kontakt, Rechnungsadresse und Status erstellen."
    >
      <div className="mb-2">
        <Link
          href="/customers"
          className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
        >
          Zurück zu Kunden
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_0.8fr]">
        <ContentCard
          title="Kundendaten"
          description="Stammdaten, Kontaktinformationen und Status."
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="FIRMENNAME"
              placeholder="Muster GmbH"
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
            />

            <Input
              label="ANSPRECHPARTNER"
              placeholder="Erika Beispiel"
              value={form.contact}
              onChange={(event) => updateField("contact", event.target.value)}
            />

            <Input
              label="E-MAIL"
              placeholder="kontakt@example.com"
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
            />

            <Input
              label="TELEFON"
              placeholder="+49 40 123456"
              value={form.phone}
              onChange={(event) => updateField("phone", event.target.value)}
            />

            <Input
              label="KUNDENNUMMER"
              placeholder="wird automatisch gesetzt"
              value={form.number}
              onChange={(event) => updateField("number", event.target.value)}
            />

            <Select
              label="STATUS"
              value={form.status}
              onChange={(event) => updateField("status", event.target.value)}
              options={[
                { label: "Aktiv", value: "active" },
                { label: "Offen", value: "open" },
                { label: "Inaktiv", value: "inactive" }
              ]}
            />
          </div>

          <div className="mt-8 border-t border-slate-100 pt-8">
            <h3 className="text-lg font-black text-slate-950">
              Rechnungsadresse
            </h3>

            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <Input
                label="STRASSE"
                placeholder="Musterstraße 12"
                value={form.street}
                onChange={(event) => updateField("street", event.target.value)}
              />

              <Input
                label="PLZ"
                placeholder="10115"
                value={form.zip}
                onChange={(event) => updateField("zip", event.target.value)}
              />

              <Input
                label="ORT"
                placeholder="Berlin"
                value={form.city}
                onChange={(event) => updateField("city", event.target.value)}
              />

              <Input
                label="LAND"
                placeholder="Deutschland"
                value={form.country}
                onChange={(event) => updateField("country", event.target.value)}
              />
            </div>
          </div>

          <FormActions>
            <Link href="/customers" className="no-underline">
              <Button variant="secondary">Abbrechen</Button>
            </Link>

            <Button
              onClick={createCustomer}
              disabled={status === "saving"}
            >
              {status === "saving" ? "Speichert..." : "Kunde erstellen"}
            </Button>
          </FormActions>

          {message && (
            <p
              className={`mt-4 rounded-2xl px-4 py-3 text-sm font-black ${
                status === "success"
                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                  : "bg-red-50 text-red-700 ring-1 ring-red-100"
              }`}
            >
              {message}
            </p>
          )}
        </ContentCard>

        <div className="space-y-6">
          <ContentCard
            title="Status"
            description="Datenbankverbindung."
          >
            <div className="rounded-[24px] bg-black p-6 text-white">
              <p className="text-xs font-black uppercase tracking-widest text-lime-200">
                Neuer Datensatz
              </p>
              <p className="mt-3 text-3xl font-black">
                Kunde
              </p>
              <p className="mt-2 text-sm font-semibold text-slate-300">
                Wird jetzt in PostgreSQL gespeichert.
              </p>
            </div>
          </ContentCard>

          <ContentCard
            title="Nach dem Speichern"
            description="Nächste Schritte."
          >
            <div className="space-y-4">
              {[
                ["Kundenübersicht", "Der Kunde ist danach über die API abrufbar."],
                ["Rechnungen", "Der Kunde kann später Rechnungen zugeordnet werden."],
                ["Projekte", "Projekte können danach mit Kunden verbunden werden."]
              ].map((item) => (
                <div key={item[0]} className="rounded-[22px] bg-slate-50 p-4">
                  <p className="font-black text-slate-950">{item[0]}</p>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {item[1]}
                  </p>
                </div>
              ))}
            </div>
          </ContentCard>
        </div>
      </div>
    </PageShell>
  )
}
