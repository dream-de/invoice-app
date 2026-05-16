"use client";

import { useState } from "react";
import Link from "next/link";
import { DocumentCanvas } from "@/components/document-editor/DocumentCanvas";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants";
import type {
  DocumentTemplate,
  PreviewInvoice,
} from "@/lib/document-templates/types";
import { Button, Input } from "@invoice-platform/ui";

/**
 * Neue Vorlage auf Basis der Standard‑Rechnungsvorlage.
 * Noch kein Speichern implementiert.
 */
export default function NewInvoiceTemplatePage() {
  const [template, setTemplate] = useState<DocumentTemplate>({
    ...DEFAULT_INVOICE_TEMPLATE,
    id: "new-invoice",
    name: "Neue Rechnungsvorlage",
  });
  const [selectedId, setSelectedId] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Dummy‑Preview
  const preview: PreviewInvoice = {
    number: "RE-9999",
    date: new Date().toISOString().slice(0, 10),
    customerName: "Beispiel Kunde",
    customerAddress: "Musterstraße 1\\n12345 Beispielstadt",
    note: "Vielen Dank für Ihr Vertrauen.",
    items: [
      { name: "Position 1", quantity: 1, price: 100, total: 100 },
      { name: "Position 2", quantity: 2, price: 50, total: 100 },
    ],
    totals: {
      net: 200,
      vat: 38,
      gross: 238,
    },
  };

  const handleMove = (id: string, x: number, y: number) => {
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.map((el) =>
        el.id === id ? { ...el, x, y } : el
      ),
    }));
  };


  async function saveTemplate() {
    try {
      setIsSaving(true);
      setStatusMsg("");
      const payload = {
        id: `invoice-template-${Date.now()}`,
        name: template.name || "Neue Rechnungsvorlage",
        type: "invoice",
        active: false,
        data: template,
      };

      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("save_failed");
      setStatusMsg("Vorlage gespeichert ✓");
    } catch {
      setStatusMsg("Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="p-6">
      <Link
        href="/documents/templates"
        className="rounded-full bg-white px-4 py-2 text-sm font-black text-slate-600 no-underline shadow-sm ring-1 ring-slate-200 hover:bg-slate-50"
      >
        &larr; Zurück
      </Link>
      <h1 className="mt-4 text-3xl font-black">Neue Rechnungsvorlage</h1>
      <p className="mt-1 text-sm text-slate-500">
        Legen Sie eine eigene Vorlage an. Speichern ist noch nicht implementiert.
      </p>

      <div className="mt-6 rounded-[36px] border border-slate-200 bg-white p-6 shadow-sm">
        <DocumentCanvas
          template={template}
          invoice={preview}
          scale={0.65}
          editable
          selectedId={selectedId}
          onSelectElement={setSelectedId}
          onMoveElement={handleMove}
        />
            {statusMsg && <p className="text-sm text-lime-300">{statusMsg}</p>}
    </div>
  </div>
  );
}
