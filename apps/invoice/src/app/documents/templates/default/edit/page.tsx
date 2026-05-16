"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@invoice-platform/ui";
import { DocumentCanvas } from "@/components/document-editor/DocumentCanvas";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants";
import type { DocumentElement, DocumentTemplate, PreviewInvoice } from "@/lib/document-templates/types";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

type TableConfig = { col1: number; col2: number; col3: number };

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

export default function DefaultTemplateEditPage() {
  const searchParams = useSearchParams();
  const templateId = searchParams?.get("templateId") || "default-invoice";
  const [templateName, setTemplateName] = useState("Standard Rechnung");
  const [scale, setScale] = useState(0.75);
  const [selectedId, setSelectedId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [clipboard, setClipboard] = useState<DocumentElement | null>(null);
  const [guideX, setGuideX] = useState<number | null>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);

  const [template, setTemplate] = useState<DocumentTemplate>({
    ...DEFAULT_INVOICE_TEMPLATE,
    id: "default-template",
    name: "Standard Rechnung",
  });

  const [tableConfigById, setTableConfigById] = useState<Record<string, TableConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const undoStackRef = useRef<DocumentTemplate[]>([]);
  const redoStackRef = useRef<DocumentTemplate[]>([]);

  const pushHistory = (nextBase?: DocumentTemplate) => {
    const snapshot = deepClone(nextBase ?? template);
    undoStackRef.current.push(snapshot);
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    redoStackRef.current = [];
  };

  const undo = () => {
    const prev = undoStackRef.current.pop();
    if (!prev) return;
    redoStackRef.current.push(deepClone(template));
    setTemplate(prev);
  };

  const redo = () => {
    const next = redoStackRef.current.pop();
    if (!next) return;
    undoStackRef.current.push(deepClone(template));
    setTemplate(next);
  };

  const preview: PreviewInvoice = {
    number: "RE-2026-1001",
    date: "2026-05-14",
    customerName: "Musterkunde GmbH",
    customerAddress: "Musterstraße 1\n12345 Berlin",
    note: "Vielen Dank für Ihren Auftrag.",
    items: [
      { name: "Beratung", quantity: 4, price: 100, total: 400 },
      { name: "Entwicklung", quantity: 10, price: 100, total: 1000 },
    ],
    totals: { net: 1400, vat: 266, gross: 1666 },
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/templates?id=${templateId}`, { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted) return;
        setTemplate(data?.data ?? data);
        if (data?.name) setTemplateName(data.name);
      } catch {}
    })();
    const moveMany = (items: Array<{ id: string; x: number; y: number }>) => {
    const snapped = items.map((it) => ({ ...it, x: snap(it.x), y: snap(it.y) }));
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.map((el) => {
        const hit = snapped.find((s) => s.id === el.id);
        return hit ? { ...el, x: hit.x, y: hit.y } : el;
      }),
    }));
    // light smart guide on first item
    if (snapped[0]) {
      setGuideX(snapped[0].x);
      setGuideY(snapped[0].y);
    }
  };

  return () => {
      mounted = false;
    };
  }, []);

  async function saveTemplate(nameOverride?: string) {
    try {
      setIsSaving(true);
      setStatusMsg("");
      const payload = { id: templateId, name: nameOverride ?? templateName, type: "invoice", active: true, data: { ...template, name: nameOverride ?? templateName } };
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save_failed");
      setStatusMsg("Gespeichert ✓");
    } catch {
      setStatusMsg("Speichern fehlgeschlagen");
    } finally {
      setIsSaving(false);
    }
  }

  const selectedElement = useMemo(
    () => template.elements.find((e) => e.id === selectedId),
    [template.elements, selectedId]
  );

  const toggleSelection = (id: string, multi = false) => {
    if (!id) {
      setSelectedId(undefined);
      setSelectedIds([]);
      return;
    }
    if (!multi) {
      setSelectedId(id);
      setSelectedIds([id]);
      return;
    }
    setSelectedId(id);
    setSelectedIds((curr) => (curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id]));
  };

  const deleteSelected = () => {
    if (selectedIds.length === 0 && selectedId) {
      deleteElement(selectedId);
      return;
    }
    if (selectedIds.length === 0) return;
    pushHistory();
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.filter((e) => !selectedIds.includes(e.id)),
    }));
    setSelectedId(undefined);
    setSelectedIds([]);
  };

  const duplicateSelected = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    pushHistory();
    setTemplate((curr) => {
      const picked = curr.elements.filter((e) => ids.includes(e.id));
      const clones = picked.map((e) => ({
        ...e,
        id: `${e.type}-${Math.random().toString(36).slice(2, 8)}`,
        x: e.x + 12,
        y: e.y + 12,
      }));
      return { ...curr, elements: [...curr.elements, ...clones] };
    });
  };

  const snap = (v: number) => (snapEnabled ? Math.round(v / gridSize) * gridSize : Math.round(v));

  const updateElement = (id: string, patch: Partial<DocumentElement>) => {
    pushHistory();
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    }));
  };

  const deleteElement = (id: string) => {
    pushHistory();
    setTemplate((curr) => ({ ...curr, elements: curr.elements.filter((e) => e.id !== id) }));
    setTableConfigById((curr) => {
      const copy = { ...curr };
      delete copy[id];
      return copy;
    });
    if (selectedId === id) setSelectedId(undefined);
  };

  const addElement = (type: DocumentElement["type"]) => {
    pushHistory();

    const base: DocumentElement = {
      id: uid(type),
      type,
      x: 80,
      y: 80,
      width: type === "line" ? 240 : type === "table" ? 420 : type === "paymentQr" ? 96 : 180,
      height: type === "line" ? 1 : type === "table" ? 140 : type === "paymentQr" ? 96 : 40,
      content:
        type === "text" ? "Neuer Text"
        : type === "table" ? "Tabelle"
        : type === "box" ? "Box"
        : type === "logo" ? "Logo"
        : type === "paymentQr" ? "SEPA QR"
        : "",
      fontSize: 14,
      fontWeight: "normal",
      color: "#111111",
      backgroundColor: type === "box" ? "#f8fafc" : "transparent",
      align: "left",
    };

    setTemplate((curr) => ({ ...curr, elements: [...curr.elements, base] }));
    setSelectedId(base.id);

    if (type === "table") {
      setTableConfigById((curr) => ({
        ...curr,
        [base.id]: { col1: 140, col2: 140, col3: 140 },
      }));
    }
  };

  const moveLayerTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    pushHistory();
    setTemplate((curr) => {
      const list = [...curr.elements];
      const from = list.findIndex((e) => e.id === fromId);
      const to = list.findIndex((e) => e.id === toId);
      if (from < 0 || to < 0) return curr;
      const [item] = list.splice(from, 1);
      list.splice(to, 0, item);
      return { ...curr, elements: list };
    });
  };

  const moveLayer = (id: string, dir: "up" | "down") => {
    pushHistory();
    setTemplate((curr) => {
      const idx = curr.elements.findIndex((e) => e.id === id);
      if (idx < 0) return curr;
      const target = dir === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= curr.elements.length) return curr;
      const copy = [...curr.elements];
      const [item] = copy.splice(idx, 1);
      copy.splice(target, 0, item);
      return { ...curr, elements: copy };
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;

      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }
      if ((mod && e.shiftKey && e.key.toLowerCase() === "z") || (mod && e.key.toLowerCase() === "y")) {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.key === "Delete" || e.key === "Backspace")) {
        e.preventDefault();
        deleteSelected();
        return;
      }

      if (mod && e.key.toLowerCase() === "c") {
        const pickId = selectedId ?? selectedIds[0];
        if (!pickId) return;
        const el = template.elements.find((x) => x.id === pickId);
        if (!el) return;
        e.preventDefault();
        setClipboard(JSON.parse(JSON.stringify(el)));
        setStatusMsg("Element kopiert");
        return;
      }

      if (mod && e.key.toLowerCase() === "v") {
        if (!clipboard) return;
        e.preventDefault();
        pushHistory();
        const clone = {
          ...clipboard,
          id: `${clipboard.type}-${Math.random().toString(36).slice(2, 8)}`,
          x: clipboard.x + 14,
          y: clipboard.y + 14,
        };
        setTemplate((curr) => ({ ...curr, elements: [...curr.elements, clone] }));
        setSelectedId(clone.id);
        setSelectedIds([clone.id]);
        setStatusMsg("Element eingefügt");
        return;
      }

      if (!selectedId) return;

      const step = e.shiftKey ? 10 : 1;
      const el = template.elements.find((x) => x.id === selectedId);
      if (!el) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        let nx = el.x;
        let ny = el.y;
        if (e.key === "ArrowUp") ny -= step;
        if (e.key === "ArrowDown") ny += step;
        if (e.key === "ArrowLeft") nx -= step;
        if (e.key === "ArrowRight") nx += step;
        updateElement(selectedId, { x: snap(nx), y: snap(ny) });
      }
    };

    window.addEventListener("keydown", handler);
    const moveMany = (items: Array<{ id: string; x: number; y: number }>) => {
    const snapped = items.map((it) => ({ ...it, x: snap(it.x), y: snap(it.y) }));
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.map((el) => {
        const hit = snapped.find((s) => s.id === el.id);
        return hit ? { ...el, x: hit.x, y: hit.y } : el;
      }),
    }));
    // light smart guide on first item
    if (snapped[0]) {
      setGuideX(snapped[0].x);
      setGuideY(snapped[0].y);
    }
  };

  return () => window.removeEventListener("keydown", handler);
  }, [selectedId, selectedIds, clipboard, template, snapEnabled, gridSize]);

  const selectedTableCfg =
    selectedElement?.type === "table"
      ? tableConfigById[selectedElement.id] ?? { col1: 140, col2: 140, col3: 140 }
      : null;

  const tableSum = selectedTableCfg ? selectedTableCfg.col1 + selectedTableCfg.col2 + selectedTableCfg.col3 : 0;
  const tableWidth = selectedElement?.type === "table" ? selectedElement.width : 0;
  const tableOverflow = selectedElement?.type === "table" ? tableSum > tableWidth : false;

  const moveMany = (items: Array<{ id: string; x: number; y: number }>) => {
    const snapped = items.map((it) => ({ ...it, x: snap(it.x), y: snap(it.y) }));
    setTemplate((curr) => ({
      ...curr,
      elements: curr.elements.map((el) => {
        const hit = snapped.find((s) => s.id === el.id);
        return hit ? { ...el, x: hit.x, y: hit.y } : el;
      }),
    }));
    // light smart guide on first item
    if (snapped[0]) {
      setGuideX(snapped[0].x);
      setGuideY(snapped[0].y);
    }
  };

  return (
    <div className="min-h-screen bg-[#f6f8fb] text-slate-900">
      <div className="grid min-h-screen grid-cols-[280px_1fr_380px]">
        <aside className="border-r border-[#e5eaf0] bg-white p-6">
          <Link href="/documents/templates" className="mb-6 inline-block text-sm font-semibold text-slate-500 no-underline hover:text-slate-900">
            ← Zurück
          </Link>

          <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Rechnung Editor</p>
          <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />

          <div className="mt-4 grid grid-cols-2 gap-2">
            <Button onClick={() => saveTemplate()} disabled={isSaving}>{isSaving ? "Speichert..." : "Speichern"}</Button>
            <Button variant="secondary" onClick={() => saveTemplate(`${templateName} Kopie`)} disabled={isSaving}>Als Kopie</Button>

            <Button variant="secondary" onClick={undo}>Undo</Button>
            <Button variant="secondary" onClick={redo}>Redo</Button>
          </div>

          {statusMsg && <p className="mt-3 text-xs text-[var(--brand-lime)]">{statusMsg}</p>}

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Button variant="secondary" onClick={duplicateSelected}>Duplizieren</Button>
            <Button variant="secondary" onClick={deleteSelected}>Löschen</Button>
          </div>

          <div className="mt-6 rounded-lg border border-[#e5eaf0] bg-[#f8fafc] p-3">
            <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Raster</p>
            <div className="flex items-center gap-2">
              <Button variant={snapEnabled ? undefined : "secondary"} onClick={() => setSnapEnabled((v) => !v)}>
                Snap {snapEnabled ? "AN" : "AUS"}
              </Button>
              <Input
                value={String(gridSize)}
                onChange={(e) => setGridSize(Math.max(1, Number(e.target.value || 10)))}
              />
            </div>
          </div>

          <div className="mt-8">
            <p className="mb-3 text-xs uppercase tracking-widest text-[#9aa4b4]">Elemente</p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="secondary" onClick={() => addElement("text")}>Text</Button>
              <Button variant="secondary" onClick={() => addElement("logo")}>Bild</Button>
              <Button variant="secondary" onClick={() => addElement("table")}>Tabelle</Button>
              <Button variant="secondary" onClick={() => addElement("box")}>Box</Button>
              <Button variant="secondary" onClick={() => addElement("line")}>Linie</Button>
              <Button variant="secondary" onClick={() => addElement("paymentQr")}>Zahlungs-QR</Button>
            </div>
          </div>
        </aside>

        <main className="overflow-auto bg-[#eef2f7] p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-black text-slate-950">Template: {templateName}</h1>
              <p className="mt-1 text-xs text-slate-500">Drag & Drop · Resize · Snap/Grid · Undo/Redo</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setScale((s) => Math.max(0.5, +(s - 0.1).toFixed(2)))}>-</Button>
              <span className="min-w-14 text-center text-sm font-semibold text-slate-600">{Math.round(scale * 100)}%</span>
              <Button variant="secondary" onClick={() => setScale((s) => Math.min(1.6, +(s + 0.1).toFixed(2)))}>+</Button>
            </div>
          </div>

          <div className="rounded-[30px] border border-[#dfe6ee] bg-white p-6 shadow-xl">
            <DocumentCanvas
              template={template}
              invoice={preview}
              editable
              scale={scale}
              selectedId={selectedId}
              onSelectElement={(id) => toggleSelection(id || "", false)}
              onMoveElement={(id, x, y) => updateElement(id, { x: snap(x), y: snap(y) })}
              onResizeElement={(id, width, height) => updateElement(id, { width: snap(width), height: snap(height) })}
              onDeleteElement={deleteElement}
              selectedIds={selectedIds}
              onMoveMany={moveMany}
              guideX={guideX}
              guideY={guideY}
              showGrid={snapEnabled}
              gridSize={gridSize}
            />
          </div>
        </main>

        <aside className="border-l border-[#e5eaf0] bg-white p-6">
          <h2 className="mb-5 text-xl font-black tracking-tight text-slate-950">Eigenschaften</h2>

          {!selectedElement ? (
            <p className="text-sm text-slate-500">Kein Element ausgewählt.</p>
          ) : (
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-slate-400">
                {selectedElement.type.toUpperCase()} · {selectedElement.id}
              </p>

              <Input label="X Position" value={String(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value || 0) })} />
              <Input label="Y Position" value={String(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value || 0) })} />
              <Input label="Breite" value={String(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value || 0) })} />
              <Input label="Höhe" value={String(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value || 0) })} />
              {selectedElement.type === "paymentQr" ? (
                <div className="rounded-2xl border border-[#e5eaf0] bg-[#f8fafc] p-4">
                  <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Zahlungsdaten</p>
                  <div className="space-y-1 text-sm text-slate-600">
                    <p><strong className="text-slate-900">Empfänger</strong>: Unternehmensdaten</p>
                    <p><strong className="text-slate-900">IBAN</strong>: Einstellungen → Finanzen</p>
                    <p><strong className="text-slate-900">BIC</strong>: Einstellungen → Finanzen</p>
                    <p><strong className="text-slate-900">Betrag</strong>: Rechnungsbetrag</p>
                  </div>
                  <div className="mt-3">
                    <Input label="Verwendungszweck" value={selectedElement.content ?? "Rechnung {{number}}"} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} />
                  </div>
                </div>
              ) : (
                <Input label="Text" value={selectedElement.content ?? ""} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} />
              )}
              <Input label="Farbe" value={selectedElement.color ?? "#111111"} onChange={(e) => updateElement(selectedElement.id, { color: e.target.value })} />
              <Input label="Schriftgröße" value={String(selectedElement.fontSize ?? 14)} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value || 14) })} />

              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Ausrichtung</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={selectedElement.align === "left" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { align: "left" })}>Links</Button>
                  <Button variant={selectedElement.align === "center" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { align: "center" })}>Mitte</Button>
                  <Button variant={selectedElement.align === "right" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { align: "right" })}>Rechts</Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Schriftstärke</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button variant={selectedElement.fontWeight === "normal" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { fontWeight: "normal" })}>Normal</Button>
                  <Button variant={selectedElement.fontWeight === "bold" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { fontWeight: "bold" })}>Bold</Button>
                  <Button variant={selectedElement.fontWeight === "black" ? undefined : "secondary"} onClick={() => updateElement(selectedElement.id, { fontWeight: "black" })}>Black</Button>
                </div>
              </div>

              {selectedElement.type === "table" && selectedTableCfg && (
                <div className="rounded-2xl border border-[#e5eaf0] bg-[#f8fafc] p-4">
                  <p className="mb-2 text-xs uppercase tracking-widest text-slate-400">Spaltenkonfiguration</p>

                  {tableOverflow && (
                    <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                      ⚠ Summe: {tableSum}px / {tableWidth}px (zu breit)
                    </div>
                  )}

                  <div className="space-y-2">
                    <Input label="Spalte 1" value={String(selectedTableCfg.col1)} onChange={(e) => setTableConfigById((c) => ({ ...c, [selectedElement.id]: { ...selectedTableCfg, col1: Number(e.target.value || 0) } }))} />
                    <Input label="Spalte 2" value={String(selectedTableCfg.col2)} onChange={(e) => setTableConfigById((c) => ({ ...c, [selectedElement.id]: { ...selectedTableCfg, col2: Number(e.target.value || 0) } }))} />
                    <Input label="Spalte 3" value={String(selectedTableCfg.col3)} onChange={(e) => setTableConfigById((c) => ({ ...c, [selectedElement.id]: { ...selectedTableCfg, col3: Number(e.target.value || 0) } }))} />
                  </div>
                </div>
              )}

              <Button variant="secondary" className="w-full border border-red-200 text-red-700 hover:bg-red-50" onClick={() => deleteElement(selectedElement.id)}>
                Ausgewähltes Element löschen
              </Button>
            </div>
          )}

          <div className="mt-10">
            <h3 className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Ebenen</h3>
            <div className="space-y-2">
              {[...template.elements].map((el, i) => (
                <div key={el.id} className={`rounded-xl border px-3 py-2 text-xs ${selectedIds.includes(el.id) || selectedId === el.id ? "border-lime-400 bg-lime-50 text-slate-950" : "border-[#e5eaf0] bg-[#f8fafc] text-slate-700"}`} draggable onDragStart={() => setDragLayerId(el.id)} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (dragLayerId) moveLayerTo(dragLayerId, el.id); setDragLayerId(null); }}>
                  <button
                    type="button"
                    className="w-full text-left font-semibold"
                    onClick={(e) => toggleSelection(el.id, e.shiftKey)}
                  >
                    {i + 1}. {el.type} ({el.id})
                  </button>
                  <div className="mt-2 flex gap-2">
                    <Button variant="secondary" className="h-8 min-w-10 px-2" onClick={() => moveLayer(el.id, "down")}>↓</Button>
                    <Button variant="secondary" className="h-8 min-w-10 px-2" onClick={() => moveLayer(el.id, "up")}>↑</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
