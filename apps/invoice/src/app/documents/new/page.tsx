"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { Button, Input, Select, Textarea } from "@invoice-platform/ui"
import { DocumentCanvas } from "@/components/document-editor/DocumentCanvas"
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants"
import type { PreviewInvoice } from "@/lib/document-templates/types"

type Customer = {
  id: string
  number: string
  name: string
  email?: string | null
  street?: string | null
  zip?: string | null
  city?: string | null
}

type InvoiceItem = {
  name: string
  quantity: string
  price: string
}

const initialItems: InvoiceItem[] = [
  { name: "Beratung", quantity: "1", price: "100" }
]

export default function NewDocumentPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState("")
  const [date, setDate] = useState("2026-05-13")
  const [note, setNote] = useState("Vielen Dank für Ihren Auftrag.")
  const [items, setItems] = useState<InvoiceItem[]>(initialItems)
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle")
  const [message, setMessage] = useState("")

  useEffect(() => {
    fetch("/api/customers/list")
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setCustomers(data)
          if (data[0]?.id) setCustomerId(data[0].id)
        }
      })
      .catch(() => {})
  }, [])

  const customer = customers.find((item) => item.id === customerId)

  const totals = useMemo(() => {
    const net = items.reduce((sum, item) => {
      const quantity = Number(item.quantity.replace(",", ".")) || 0
      const price = Number(item.price.replace(",", ".")) || 0
      return sum + quantity * price
    }, 0)

    return {
      net,
      tax: net * 0.19,
      gross: net * 1.19
    }
  }, [items])

  const previewInvoice: PreviewInvoice = {
    number: "VORSCHAU",
    date,
    customerName: customer?.name || "Kein Kunde ausgewählt",
    customerAddress: `${customer?.street || "Straße"}\n${customer?.zip || "PLZ"} ${customer?.city || "Ort"}`,
    note,
    items: items.map((item) => {
      const quantity = Number(item.quantity.replace(",", ".")) || 0
      const price = Number(item.price.replace(",", ".")) || 0

      return {
        name: item.name || "Position",
        quantity,
        price,
        total: quantity * price
      }
    }),
    totals: {
      net: totals.net,
      vat: totals.tax,
      gross: totals.gross
    }
  }

  function updateItem(index: number, field: keyof InvoiceItem, value: string) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [field]: value } : item
      )
    )
  }

  function addItem() {
    setItems((current) => [
      ...current,
      { name: "", quantity: "1", price: "0" }
    ])
  }

  async function createInvoice() {
    setStatus("saving")
    setMessage("")

    try {
      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          customerId: customerId || undefined,
          date,
          taxRate: 0.19,
          tip: 0,
          note,
          items: previewInvoice.items
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result?.error || "Rechnung konnte nicht erstellt werden.")
      }

      window.location.href = `/documents/${result.invoice.id}`
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : "Unbekannter Fehler")
    }
  }

  return (
    <div className="min-h-screen bg-neutral-700 lg:grid lg:grid-cols-[minmax(420px,520px)_minmax(0,1fr)]">
      <aside className="flex min-h-screen flex-col bg-white lg:h-screen lg:min-h-0">
        <div className="flex-1 overflow-y-auto p-6 pb-28 sm:p-8 sm:pb-32">
          <Link href="/documents" className="text-sm font-black uppercase tracking-widest text-slate-400 no-underline">
            ← Zurück zur Übersicht
          </Link>

          <h1 className="mt-8 text-3xl font-black text-slate-950">
            Rechnung erstellen
          </h1>

          <div className="mt-8 space-y-6">
          <Select
            label="KUNDE"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
            options={[
              { label: "Kein Kunde", value: "" },
              ...customers.map((customer) => ({
                label: `${customer.number} · ${customer.name}`,
                value: customer.id
              }))
            ]}
          />

          <Input
            label="DATUM"
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />

          {items.map((item, index) => (
            <div key={index} className="rounded-[28px] border border-slate-200 p-5">
              <Input
                label="BEZEICHNUNG"
                value={item.name}
                onChange={(event) => updateItem(index, "name", event.target.value)}
              />

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Input
                  label="MENGE"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, "quantity", event.target.value)}
                />

                <Input
                  label="PREIS"
                  value={item.price}
                  onChange={(event) => updateItem(index, "price", event.target.value)}
                />
              </div>
            </div>
          ))}

          <Button variant="secondary" onClick={addItem}>
            Position hinzufügen
          </Button>

          <Textarea
            label="NOTIZ"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
          </div>
        </div>

        <div className="sticky bottom-0 border-t border-slate-200 bg-white/95 p-6 shadow-[0_-18px_45px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <Button onClick={createInvoice} disabled={status === "saving"} className="w-full">
            {status === "saving" ? "Speichert..." : "Rechnung erstellen"}
          </Button>

          {message && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
              {message}
            </p>
          )}
        </div>
      </aside>

      <main className="h-[78vh] overflow-auto bg-neutral-700 p-3 sm:p-6 lg:h-screen lg:p-8">
        <p className="mb-5 text-center text-xs font-black uppercase tracking-widest text-slate-300">
          Live Vorschau
        </p>

        <div className="flex justify-center pb-10">
          <DocumentCanvas
            template={DEFAULT_INVOICE_TEMPLATE}
            invoice={previewInvoice}
            scale={0.46}
          />
        </div>
      </main>
    </div>
  )
}
