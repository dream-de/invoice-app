"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button, Input } from "@invoice-platform/ui";
import { DocumentCanvas } from "@/components/document-editor/DocumentCanvas";
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants";
import { FONT_OPTIONS, INVOICE_LAYER_NAMES, INVOICE_LAYER_Z, LAYER_TYPE_ICON, createDynamicTokenGroups, getElementTypeLabel, getInvoiceLayerName } from "@/lib/document-templates/editor-options";
import { createTemplatePreviewInvoice } from "@/lib/document-templates/preview";
import { DEFAULT_TABLE_CONFIG, calculateTemplateAutoScale, decreaseTemplateScale, deepClone, increaseTemplateScale, cloneTemplateElement, createTemplateElement, duplicateTemplateElements, moveTemplateLayer, moveTemplateLayerTo, removeTemplateElement, removeTemplateElements, getTemplateElementForClipboard, isEditableShortcutTarget, moveTemplateElementWithKeyboard, createTemplateSavePayload } from "@/lib/document-templates/editor-utils";
import type { TableConfig } from "@/lib/document-templates/editor-utils";
import type { DocumentElement, DocumentTemplate } from "@/lib/document-templates/types";
import { useLanguage } from "@/lib/i18n";

export default function DefaultTemplateEditPage() {
  const searchParams = useSearchParams();
  const { t } = useLanguage();
  const templateId = searchParams?.get("templateId") || "default-invoice";
  const [templateName, setTemplateName] = useState(t("templates.editor.templateName.default"));
  const [scale, setScale] = useState(1);
  const [selectedId, setSelectedId] = useState<string | undefined>("selectedText");
  const [selectedIds, setSelectedIds] = useState<string[]>(["selectedText"]);
  const [clipboard, setClipboard] = useState<DocumentElement | null>(null);
  const [guideX, setGuideX] = useState<number | null>(null);
  const [guideY, setGuideY] = useState<number | null>(null);
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);
  const [rightPanel, setRightPanel] = useState<"properties" | "layers">("properties");

  const [template, setTemplate] = useState<DocumentTemplate>({
    ...DEFAULT_INVOICE_TEMPLATE,
    id: "default-template",
    name: t("templates.editor.templateName.generated"),
  });

  const [tableConfigById, setTableConfigById] = useState<Record<string, TableConfig>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string>("");

  const [snapEnabled, setSnapEnabled] = useState(true);
  const [gridSize, setGridSize] = useState(10);

  const undoStackRef = useRef<DocumentTemplate[]>([]);
  const redoStackRef = useRef<DocumentTemplate[]>([]);
  const manualZoomRef = useRef(false);

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

  const preview = createTemplatePreviewInvoice(t);

  useEffect(() => {
    const updateScale = () => {
      if (manualZoomRef.current) return;
      setScale(calculateTemplateAutoScale(window.innerWidth));
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

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
  return () => {
      mounted = false;
    };
  }, []);

  async function saveTemplate(nameOverride?: string, asCopy = false) {
    try {
      setIsSaving(true);
      setStatusMsg("");
      const payload = createTemplateSavePayload({ templateId, templateName, template, asCopy, nameOverride });
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("save_failed");
      setStatusMsg(asCopy ? t("templates.editor.status.copySaved") : t("templates.editor.status.saved"));
    } catch {
      setStatusMsg(t("templates.editor.status.saveFailed"));
    } finally {
      setIsSaving(false);
    }
  }

  const exportTemplatePdf = () => {
    manualZoomRef.current = true;
    setScale(1);
    setTimeout(() => window.print(), 50);
  };

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
    setTemplate((curr) => removeTemplateElements(curr, selectedIds));
    setSelectedId(undefined);
    setSelectedIds([]);
  };

  const duplicateSelected = () => {
    const ids = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!ids.length) return;
    pushHistory();
    setTemplate((curr) => ({ ...curr, elements: [...curr.elements, ...duplicateTemplateElements(curr.elements, ids)] }));
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
    setTemplate((curr) => removeTemplateElement(curr, id));
    setTableConfigById((curr) => {
      const copy = { ...curr };
      delete copy[id];
      return copy;
    });
    if (selectedId === id) setSelectedId(undefined);
  };

  const addElement = (type: DocumentElement["type"]) => {
    pushHistory();

    const base = createTemplateElement(type, (elementType) =>
      elementType === "text" ? t("templates.editor.add.text")
      : elementType === "table" ? t("templates.editor.add.table")
      : elementType === "box" ? t("templates.editor.add.box")
      : elementType === "logo" ? t("templates.editor.add.logo")
      : ""
    );

    setTemplate((curr) => ({ ...curr, elements: [...curr.elements, base] }));
    setSelectedId(base.id);
    setSelectedIds([base.id]);

    if (type === "table") {
      setTableConfigById((curr) => ({
        ...curr,
        [base.id]: DEFAULT_TABLE_CONFIG,
      }));
    }
  };

  const moveLayerTo = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    pushHistory();
    setTemplate((curr) => ({ ...curr, elements: moveTemplateLayerTo(curr.elements, fromId, toId) }));
  };

  const moveLayer = (id: string, dir: "up" | "down") => {
    pushHistory();
    setTemplate((curr) => ({ ...curr, elements: moveTemplateLayer(curr.elements, id, dir) }));
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableShortcutTarget(e.target)) return;

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
        const el = getTemplateElementForClipboard(template.elements, selectedId, selectedIds);
        if (!el) return;
        e.preventDefault();
        setClipboard(deepClone(el));
        setStatusMsg(t("templates.editor.status.copied"));
        return;
      }

      if (mod && e.key.toLowerCase() === "v") {
        if (!clipboard) return;
        e.preventDefault();
        pushHistory();
        const clone = cloneTemplateElement(clipboard);
        setTemplate((curr) => ({ ...curr, elements: [...curr.elements, clone] }));
        setSelectedId(clone.id);
        setSelectedIds([clone.id]);
        setStatusMsg(t("templates.editor.status.pasted"));
        return;
      }

      if (!selectedId) return;

      const step = e.shiftKey ? 10 : 1;
      const el = template.elements.find((x) => x.id === selectedId);
      if (!el) return;

      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        updateElement(selectedId, moveTemplateElementWithKeyboard(el, e.key, step, snap));
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
      ? tableConfigById[selectedElement.id] ?? DEFAULT_TABLE_CONFIG
      : null;

  const tableSum = selectedTableCfg ? selectedTableCfg.col1 + selectedTableCfg.col2 + selectedTableCfg.col3 : 0;
  const tableWidth = selectedElement?.type === "table" ? selectedElement.width : 0;
  const tableOverflow = selectedElement?.type === "table" ? tableSum > tableWidth : false;


  const elementTypeLabel = getElementTypeLabel(selectedElement?.type, t);

  const dynamicTokenGroups = createDynamicTokenGroups(t);

  const sectionTitle = (title: string) => (
    <div className="mb-4 border-b border-slate-400/70 pb-2 text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">
      {title}
    </div>
  );

  const layoutFields = (options: { height?: boolean; widthLabel?: string } = {}) => {
    if (!selectedElement) return null;

    return (
      <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        {sectionTitle(t("templates.editor.properties.layout"))}
        <div className="grid grid-cols-2 gap-3">
          <Input label={t("templates.editor.properties.xPosition")} value={String(selectedElement.x)} onChange={(e) => updateElement(selectedElement.id, { x: Number(e.target.value || 0) })} />
          <Input label={t("templates.editor.properties.yPosition")} value={String(selectedElement.y)} onChange={(e) => updateElement(selectedElement.id, { y: Number(e.target.value || 0) })} />
          <Input label={options.widthLabel ?? t("templates.editor.properties.width")} value={String(selectedElement.width)} onChange={(e) => updateElement(selectedElement.id, { width: Number(e.target.value || 0) })} />
          {options.height !== false && (
            <Input label={t("templates.editor.properties.height")} value={String(selectedElement.height)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value || 0) })} />
          )}
        </div>
      </div>
    );
  };

  const insertDynamicToken = (token: string) => {
    if (!selectedElement || selectedElement.type !== "text") return;
    const current = selectedElement.content ?? "";
    const next = current ? `${current} ${token}` : token;
    updateElement(selectedElement.id, { content: next });
  };

  const dynamicDataPanel = () => (
    <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-[#f7f8fa]">
      <div className="bg-[#eef0f3] px-4 py-3 text-sm font-black text-slate-600">{t("templates.editor.dynamic.title")}</div>
      <div className="space-y-2 p-3 text-sm font-bold text-slate-600">
        {dynamicTokenGroups.map((group, groupIndex) => (
          <details key={group.title} className="overflow-hidden rounded-2xl bg-white shadow-sm" open={groupIndex === 0}>
            <summary className="cursor-pointer px-4 py-3 text-[12px] font-black uppercase tracking-[0.08em] text-slate-700">{group.title}</summary>
            <div className="grid gap-1 px-2 pb-2">
              {group.tokens.map((token) => (
                <button
                  key={token.value}
                  type="button"
                  onClick={() => insertDynamicToken(token.value)}
                  className="rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                >
                  {token.label}
                </button>
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );

  const ColorControl = ({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) => (
    <div>
      <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{label}</label>
      <div className="grid grid-cols-[42px_1fr] items-center gap-2 rounded-full bg-[#f8fafc] p-1 shadow-[inset_0_0_0_1px_rgba(148,163,184,0.18)]">
        <input
          type="color"
          value={value.startsWith("#") ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-full border-0 bg-transparent p-0"
          aria-label={label}
        />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-9 w-full border-0 bg-transparent px-2 text-sm font-bold text-slate-700 outline-none"
        />
      </div>
    </div>
  );

  const typographyPanel = () => {
    if (!selectedElement) return null;

    return (
      <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
        {sectionTitle(t("templates.editor.properties.typography"))}
        <div className="grid grid-cols-[1fr_86px] gap-3">
          <ColorControl label={t("templates.editor.properties.color")} value={selectedElement.color ?? "#000000"} onChange={(value) => updateElement(selectedElement.id, { color: value })} />
          <Input label={t("templates.editor.properties.size")} value={String(selectedElement.fontSize ?? 14)} onChange={(e) => updateElement(selectedElement.id, { fontSize: Number(e.target.value || 14) })} />
        </div>
        <div className="mt-3">
          <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{t("templates.editor.properties.fontFamily")}</label>
          <select
            value={selectedElement.fontFamily ?? "Inter, system-ui, sans-serif"}
            onChange={(e) => updateElement(selectedElement.id, { fontFamily: e.target.value })}
            className="min-h-[42px] w-full rounded-full border border-slate-200 bg-[#f8fafc] px-4 text-sm font-bold text-slate-700 outline-none"
          >
            {FONT_OPTIONS.map((font) => <option key={font.value} value={font.value}>{font.label}</option>)}
          </select>
        </div>
        <div className="mt-3 grid grid-cols-4 overflow-hidden rounded-full bg-[#eef2f4] p-1 text-sm font-black text-slate-600">
          <button type="button" className="rounded-full bg-white py-2 shadow-sm" onClick={() => updateElement(selectedElement.id, { align: "left" })}>☰</button>
          <button type="button" className="py-2" onClick={() => updateElement(selectedElement.id, { align: "center" })}>☰</button>
          <button type="button" className="py-2" onClick={() => updateElement(selectedElement.id, { align: "right" })}>☰</button>
          <button type="button" className="border-l border-slate-300 py-2" onClick={() => updateElement(selectedElement.id, { fontWeight: selectedElement.fontWeight === "bold" ? "normal" : "bold" })}>B</button>
        </div>
      </div>
    );
  };





  const renderLayersPanel = () => {
    const layers = [...template.elements].filter((element) => INVOICE_LAYER_NAMES[element.id]).reverse();

    return (
      <div className="pt-1">
        <div className="mb-7 flex items-center gap-3">
          <span className="text-[var(--brand-lime)]">▰</span>
          <h2 className="text-2xl font-black tracking-tight">{t("templates.editor.layers.title")}</h2>
        </div>

        <div className="space-y-2">
          {layers.map((element) => {
            const originalIndex = template.elements.findIndex((item) => item.id === element.id);
            const active = selectedIds.includes(element.id) || selectedId === element.id;

            return (
              <div
                key={element.id}
                draggable
                onDragStart={() => setDragLayerId(element.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  if (dragLayerId) moveLayerTo(dragLayerId, element.id);
                  setDragLayerId(null);
                }}
                onClick={() => toggleSelection(element.id, false)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") toggleSelection(element.id, false);
                }}
                role="button"
                tabIndex={0}
                className={`group flex min-h-[58px] w-full cursor-pointer items-center gap-3 rounded-[28px] border px-4 py-3 text-left transition ${active ? "border-[var(--brand-lime)] bg-lime-50/70 shadow-[0_12px_28px_rgba(217,249,68,0.18)]" : "border-slate-100 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.04)] hover:border-slate-200 hover:bg-slate-50"}`}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-50 text-sm font-black text-slate-400">
                  {LAYER_TYPE_ICON[element.type]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-black text-slate-700">{getInvoiceLayerName(element.id, t)}</span>
                  <span className="mt-0.5 block text-[11px] font-bold text-slate-400">{t("templates.editor.layers.zIndex").replace("{z}", String(INVOICE_LAYER_Z[element.id] ?? 10))}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100">
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveLayer(element.id, "up");
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500 hover:bg-slate-200"
                    aria-label={t("templates.editor.layers.moveUp")}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      moveLayer(element.id, "down");
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-black text-slate-500 hover:bg-slate-200"
                    aria-label={t("templates.editor.layers.moveDown")}
                  >
                    ↓
                  </button>
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderElementProperties = () => {
    if (!selectedElement) {
      return <p className="mt-5 rounded-[24px] bg-white p-5 text-sm font-semibold text-slate-500 shadow-sm">{t("templates.editor.properties.noneSelected")}</p>;
    }

    return (
      <div className="mt-5 space-y-7">
        <div>
          <p className="mb-5 inline-flex rounded-md bg-[var(--brand-lime)] px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-black shadow-[0_10px_20px_rgba(217,249,68,0.22)]">{elementTypeLabel}</p>
        </div>

        {selectedElement.type === "text" && (
          <>
            <div className="rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.06)]">
              <p className="mb-3 text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{t("templates.editor.properties.content")}</p>
              <textarea
                className="min-h-[126px] w-full resize-y rounded-[26px] border border-slate-200 bg-[#f8fafc] px-4 py-4 text-base font-semibold leading-7 text-slate-700 outline-none transition focus:border-[var(--brand-lime)] focus:bg-white focus:shadow-[0_0_0_3px_rgba(217,249,68,0.28)]"
                value={selectedElement.content ?? ""}
                onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })}
              />
              {dynamicDataPanel()}
            </div>
            {layoutFields({ height: false })}
            {typographyPanel()}
          </>
        )}

        {selectedElement.type === "logo" && (
          <>
            {layoutFields()}
            <div>
              {sectionTitle(t("templates.editor.properties.display"))}
              <ColorControl label={t("templates.editor.properties.color")} value={selectedElement.backgroundColor ?? "#f4f4f4"} onChange={(value) => updateElement(selectedElement.id, { backgroundColor: value })} />
            </div>
          </>
        )}
        {selectedElement.type === "box" && (
          <>
            {layoutFields()}
            <div>
              {sectionTitle(t("templates.editor.properties.display"))}
              <div className="grid grid-cols-2 gap-3">
                <ColorControl label={t("templates.editor.properties.fill")} value={selectedElement.backgroundColor ?? "#f8fafc"} onChange={(value) => updateElement(selectedElement.id, { backgroundColor: value })} />
                <ColorControl label={t("templates.editor.properties.border")} value={selectedElement.color ?? "#d1d5db"} onChange={(value) => updateElement(selectedElement.id, { color: value })} />
              </div>
            </div>
          </>
        )}

        {selectedElement.type === "line" && (
          <>
            {layoutFields({ height: false })}
            <div>
              {sectionTitle(t("templates.editor.properties.lineSettings"))}
              <div className="grid grid-cols-[1fr_120px] gap-3">
                <ColorControl label={t("templates.editor.properties.color")} value={selectedElement.color ?? selectedElement.backgroundColor ?? "#d1d5db"} onChange={(value) => updateElement(selectedElement.id, { color: value, backgroundColor: value })} />
                <Input label={t("templates.editor.properties.thickness")} value={String(selectedElement.borderWidth ?? selectedElement.height ?? 2)} onChange={(e) => updateElement(selectedElement.id, { height: Number(e.target.value || 1), borderWidth: Number(e.target.value || 1) })} />
              </div>
            </div>
          </>
        )}

        {selectedElement.type === "paymentQr" && (
          <>
            <div>
              {sectionTitle(t("templates.editor.properties.sepaQrData"))}
              <div className="space-y-3">
                <Input label={t("templates.editor.properties.iban")} value={selectedElement.content ?? ""} onChange={(e) => updateElement(selectedElement.id, { content: e.target.value })} placeholder={t("templates.editor.properties.ibanPlaceholder")} />
                <Input label={t("templates.editor.properties.bic")} value={selectedElement.backgroundColor ?? ""} onChange={(e) => updateElement(selectedElement.id, { backgroundColor: e.target.value })} placeholder={t("templates.editor.properties.bicPlaceholder")} />
              </div>
            </div>
            {layoutFields({ height: false })}
          </>
        )}

        {selectedElement.type === "table" && selectedTableCfg && (
          <>
            <div>
              <div className="mb-4 flex items-center justify-between border-b border-slate-400/70 pb-2 text-[12px] font-black uppercase tracking-[0.16em] text-slate-500">
                <span>{t("templates.editor.properties.columns")}</span>
                <span className="text-base text-slate-400">▥</span>
              </div>
              {tableOverflow && (
                <div className="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-black text-red-600">
                  {t("templates.editor.properties.tableOverflow").replace("{sum}", String(tableSum)).replace("{width}", String(tableWidth))}
                </div>
              )}
              <div className="space-y-4">
                {[
                  { key: "col1", label: t("templates.editor.properties.column1"), value: selectedTableCfg.col1 },
                  { key: "col2", label: t("templates.editor.properties.column2"), value: selectedTableCfg.col2 },
                  { key: "col3", label: t("templates.editor.properties.column3"), value: selectedTableCfg.col3 }
                ].map((column) => (
                  <div key={column.key} className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_10px_25px_rgba(15,23,42,0.06)]">
                    <div className="mb-5 flex items-center justify-between text-base font-black text-slate-800">
                      <span>{column.label}</span>
                      <span className="text-slate-700">⊙</span>
                    </div>
                    <div className="grid grid-cols-[1fr_1.25fr] gap-3">
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{t("templates.editor.properties.width")}</label>
                        <div className="grid grid-cols-[1fr_auto] items-center rounded-full bg-[#f8fafc] px-3">
                          <input
                            className="min-h-10 w-full border-0 bg-transparent px-0 text-sm font-bold text-slate-700 outline-none"
                            value={String(column.value)}
                            onChange={(e) => setTableConfigById((current) => ({
                              ...current,
                              [selectedElement.id]: {
                                ...selectedTableCfg,
                                [column.key]: Number(e.target.value || 0)
                              }
                            }))}
                          />
                          <span className="text-xs font-bold text-slate-300">px</span>
                        </div>
                      </div>
                      <div>
                        <label className="mb-2 block text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">{t("templates.editor.properties.align")}</label>
                        <div className="grid grid-cols-3 overflow-hidden rounded-full bg-[#f8fafc] p-1 text-xs font-black text-slate-400">
                          <button type="button" className="rounded-full bg-white py-2 text-slate-700 shadow-sm" onClick={() => updateElement(selectedElement.id, { align: "left" })}>☰</button>
                          <button type="button" className="py-2" onClick={() => updateElement(selectedElement.id, { align: "center" })}>☰</button>
                          <button type="button" className="py-2" onClick={() => updateElement(selectedElement.id, { align: "right" })}>☰</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {layoutFields({ height: false })}
            {typographyPanel()}
          </>
        )}
      </div>
    );
  };

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
    <div className="dark-template-editor fixed inset-0 z-[140] overflow-hidden bg-white text-slate-950">
      <div className="flex h-10 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="flex items-center gap-2 font-black">
          <span className="text-[var(--brand-lime)]">B</span>
          <span>Invoice</span>
        </div>
        <div className="flex items-center gap-4 text-slate-500">
          <span>−</span>
          <span>□</span>
          <span>×</span>
        </div>
      </div>
      <div className="template-editor-grid grid h-[calc(100vh-40px)] grid-cols-[292px_minmax(0,1fr)_292px] overflow-hidden">
        <aside className="template-editor-left relative flex h-[calc(100vh-40px)] flex-col overflow-hidden border-r border-[#222] bg-[#111111] px-5 py-6 text-white shadow-[18px_0_42px_rgba(0,0,0,0.20)]">
          <div className="template-editor-left-scroll min-h-0 flex-1 overflow-y-auto pr-2">
            <Link href="/documents/templates" className="mb-6 inline-flex items-center gap-3 text-sm font-black uppercase tracking-[0.20em] text-white/48 no-underline hover:text-white">
              <span className="text-xl leading-none">←</span>
              <span>{t("templates.editor.left.back")}</span>
            </Link>

            <p className="mb-3 inline-flex rounded-md bg-[#1e293b] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-white/75">{t("templates.editor.left.badge")}</p>
            <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-white/32">{t("templates.editor.left.name")}</label>
            <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} />

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => saveTemplate()} disabled={isSaving} className="min-h-10 rounded-full bg-[var(--brand-lime)] px-3 text-xs font-black text-black shadow-[0_14px_34px_rgba(217,249,68,0.14)]">{isSaving ? t("templates.editor.left.saving") : t("templates.editor.left.save")}</button>
              <button type="button" onClick={() => saveTemplate(`${templateName} ${t("templates.editor.left.copySuffix")}`, true)} disabled={isSaving} className="min-h-10 rounded-full border border-white/10 bg-white/[0.045] px-3 text-xs font-black text-white/78 hover:bg-white/8 hover:text-white">{t("templates.editor.left.saveCopy")}</button>
            </div>
            {statusMsg && <p className="mt-3 text-xs font-bold text-[var(--brand-lime)]">{statusMsg}</p>}

            <div className="mt-8">
              <p className="text-[22px] font-black leading-none text-white">{t("templates.editor.left.title")}</p>
              <p className="mt-1 text-xs font-semibold text-white/34">{t("templates.editor.left.subtitle")}</p>
            </div>

            <p className="mt-5 text-[10px] font-black uppercase tracking-[0.24em] text-white/34">{t("templates.editor.left.elements")}</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => addElement("text")} className="editor-tool">T<span>{t("templates.editor.left.tools.text")}</span></button>
              <button type="button" onClick={() => addElement("logo")} className="editor-tool">▧<span>{t("templates.editor.left.tools.image")}</span></button>
              <button type="button" onClick={() => addElement("table")} className="editor-tool">▦<span>{t("templates.editor.left.tools.table")}</span></button>
              <button type="button" onClick={() => addElement("box")} className="editor-tool">□<span>{t("templates.editor.left.tools.box")}</span></button>
              <button type="button" onClick={() => addElement("line")} className="editor-tool">−<span>{t("templates.editor.left.tools.line")}</span></button>
              <button type="button" onClick={() => addElement("paymentQr")} className="editor-tool">⌗<span>{t("templates.editor.left.tools.sepaQr")}</span></button>
            </div>

            <div className="mt-6 border-t border-white/8 pt-5">
              <div className="rounded-[22px] border border-white/10 bg-white/[0.045] px-3 py-2.5">
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/16 text-emerald-400">♧</span>
                  <div>
                    <p className="text-sm font-black text-white">{t("templates.editor.left.legalCheck.title")}</p>
                    <p className="text-xs font-semibold text-white/34">{t("templates.editor.left.legalCheck.subtitle")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="shrink-0 border-t border-white/8 bg-[#0f0f0f] pt-5">
            <button type="button" onClick={exportTemplatePdf} className="w-full rounded-full bg-white px-4 py-3 text-base font-black text-slate-950 shadow-[0_18px_45px_rgba(0,0,0,0.28)]">▣ {t("templates.editor.left.pdfExport")}</button>
            <div className="mt-4 flex items-center justify-center gap-4 rounded-full bg-black/55 px-4 py-3 text-[11px] font-black text-white/70"><button type="button" aria-label={t("templates.editor.zoom.out")} title={t("templates.editor.zoom.out")} onClick={() => { manualZoomRef.current = true; setScale((s) => decreaseTemplateScale(s)); }}>⌕</button><span>{Math.round((scale / 1.22) * 100)}%</span><button type="button" aria-label={t("templates.editor.zoom.in")} title={t("templates.editor.zoom.in")} onClick={() => { manualZoomRef.current = true; setScale((s) => increaseTemplateScale(s)); }}>⌕</button></div>
          </div>
        </aside>
        <main className="template-editor-main relative h-[calc(100vh-40px)] overflow-auto bg-[#1c1c1c] px-10 py-9">
          <div className="flex min-h-[calc(100vh-112px)] w-full min-w-0 items-start justify-center">
            <DocumentCanvas template={template} invoice={preview} editable scale={scale} selectedId={selectedId} onSelectElement={(id) => toggleSelection(id || "", false)} onMoveElement={(id, x, y) => updateElement(id, { x: snap(x), y: snap(y) })} onResizeElement={(id, width, height) => updateElement(id, { width: snap(width), height: snap(height) })} onDeleteElement={deleteElement} selectedIds={selectedIds} onMoveMany={moveMany} guideX={guideX} guideY={guideY} showGrid={false} gridSize={gridSize} showTemplateTokens showRuler={false} />
          </div>
        </main>
        <aside className="template-editor-right h-[calc(100vh-40px)] overflow-y-auto bg-white px-5 py-6 text-slate-950 shadow-[inset_1px_0_0_rgba(15,23,42,0.10)]">
          <div className="-mx-5 -mt-6 mb-6 grid grid-cols-2 border-b border-slate-200 bg-[#111111] text-[11px] font-black uppercase tracking-[0.14em]">
            <button type="button" onClick={() => setRightPanel("properties")} className={`min-h-10 px-4 ${rightPanel === "properties" ? "bg-[#171717] text-[var(--brand-lime)]" : "text-white/42 hover:text-white"}`}>☷ {t("templates.editor.right.properties")}</button>
            <button type="button" onClick={() => setRightPanel("layers")} className={`min-h-10 px-4 ${rightPanel === "layers" ? "bg-[#171717] text-[var(--brand-lime)]" : "text-white/42 hover:text-white"}`}>▰ {t("templates.editor.right.layers")}</button>
          </div>
          {rightPanel === "properties" ? (
            <>
              <h2 className="text-2xl font-black tracking-tight">{t("templates.editor.right.properties")}</h2>
              {renderElementProperties()}
              <button type="button" className="mt-8 w-full rounded-full border border-red-200 bg-red-50 px-4 py-3 text-xs font-black text-red-700" onClick={deleteSelected}>{t("templates.editor.right.deleteElement")}</button>
            </>
          ) : renderLayersPanel()}
        </aside>
      </div>
      <style>{`.template-editor-left{background:linear-gradient(180deg,#151515 0%,#101010 42%,#090909 100%)!important;box-shadow:inset -1px 0 0 #222,inset 0 1px 0 rgba(255,255,255,.055),18px 0 42px rgba(0,0,0,.22)!important}.template-editor-left::before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(115deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,0) 34%),radial-gradient(circle at 35% 0%,rgba(255,255,255,.055),rgba(255,255,255,0) 36%)}.dark-template-editor input,.dark-template-editor select,.dark-template-editor textarea{min-height:42px;border-radius:999px;border-color:rgba(148,163,184,.22);background:rgba(255,255,255,.96);font-size:14px;font-weight:700}.dark-template-editor textarea{resize:none}.dark-template-editor aside:first-child input{border:1px solid rgba(255,255,255,.12);background:#050505;color:white;min-height:46px;border-radius:999px;padding-left:16px;font-size:15px;font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.editor-tool{display:flex;min-height:74px;flex-direction:column;align-items:center;justify-content:center;gap:7px;border:1px solid rgba(255,255,255,.10);border-radius:22px;background:rgba(255,255,255,.045);color:rgba(226,232,240,.62);font-size:20px;font-weight:500;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.editor-tool span{font-size:11px;font-weight:800;color:rgba(226,232,240,.62)}.editor-tool-active{border-color:rgba(255,255,255,.10);background:rgba(255,255,255,.045);color:rgba(226,232,240,.62);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}.editor-tool-active span{color:rgba(226,232,240,.62)}.dark-template-editor main [class*="relative bg-white"]{box-shadow:0 34px 90px rgba(0,0,0,.44)!important}.dark-template-editor main::-webkit-scrollbar{width:12px;height:12px}.dark-template-editor main::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(255,255,255,.25)}.template-editor-left-scroll,.template-editor-right{scrollbar-width:thin;scrollbar-color:rgba(148,163,184,.42) transparent;scrollbar-gutter:stable}.template-editor-left-scroll::-webkit-scrollbar,.template-editor-right::-webkit-scrollbar{width:7px;height:7px}.template-editor-left-scroll::-webkit-scrollbar-thumb,.template-editor-right::-webkit-scrollbar-thumb{border-radius:999px;background:rgba(148,163,184,.42)}.template-editor-left-scroll::-webkit-scrollbar-track,.template-editor-right::-webkit-scrollbar-track{background:transparent}@media (max-width:900px){.template-editor-grid{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important}.template-editor-main{display:none}.template-editor-left{padding-left:24px!important;padding-right:16px!important}.template-editor-right{padding-left:14px!important;padding-right:14px!important}.template-editor-left input{min-height:46px!important;font-size:14px!important}.template-editor-left .editor-tool{min-height:66px!important;border-radius:20px!important;font-size:19px!important}.template-editor-left .editor-tool span{font-size:11px!important}}@media print{body{margin:0!important;background:white!important}.dark-template-editor{position:static!important;inset:auto!important;z-index:auto!important;overflow:visible!important;background:white!important}.dark-template-editor>div:first-child,.template-editor-left,.template-editor-right{display:none!important}.template-editor-grid{display:block!important;height:auto!important;overflow:visible!important}.template-editor-main{display:block!important;height:auto!important;overflow:visible!important;background:white!important;padding:0!important}.template-editor-main>.flex{display:block!important;min-height:auto!important}.template-editor-main .relative.mx-auto.w-fit{margin:0!important}.template-editor-main [style*="transform"]{transform:scale(1)!important;transform-origin:top left!important;box-shadow:none!important}.template-editor-main [style*="width: 794px"]{width:794px!important;height:1123px!important}@page{size:A4;margin:0}}`}</style>
    </div>
  );
}
