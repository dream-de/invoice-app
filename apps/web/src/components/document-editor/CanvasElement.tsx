"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import type { DocumentElement, PreviewInvoice } from "@/lib/document-templates/types";
import { useLanguage } from "@/lib/i18n";

function tokenLabels(t: ReturnType<typeof useLanguage>["t"]): Record<string, string> {
  return {
    "invoice.number": t("templates.editor.dynamic.number"),
    "invoice.date": t("templates.editor.dynamic.date"),
    "invoice.dueDate": t("templates.editor.dynamic.dueDate"),
    "invoice.servicePeriod": t("templates.editor.dynamic.servicePeriod"),
    "invoice.serviceDate": t("templates.editor.dynamic.servicePeriod"),
    "client.name": t("templates.editor.dynamic.name"),
    "client.address": t("templates.editor.dynamic.address"),
    "client.email": t("templates.editor.dynamic.email"),
    "client.number": t("templates.editor.dynamic.customerNumber"),
    "company.name": t("templates.editor.dynamic.name"),
    "company.street": t("templates.editor.dynamic.street"),
    "company.city": t("templates.editor.dynamic.city"),
    "company.vatId": t("templates.editor.dynamic.vatId"),
    "finance.iban": t("templates.editor.dynamic.iban"),
    "finance.bic": t("templates.editor.dynamic.bic"),
    "finance.taxNumber": t("templates.editor.dynamic.taxNumber"),
    "totals.net": t("templates.editor.dynamic.net"),
    "totals.vat": t("templates.editor.dynamic.vatAmount"),
    "totals.gross": t("templates.editor.dynamic.gross"),
    number: t("templates.editor.dynamic.number"),
    date: t("templates.editor.dynamic.date"),
    dueDate: t("templates.editor.dynamic.dueDate"),
    serviceDate: t("templates.editor.dynamic.servicePeriod"),
    customerName: t("templates.editor.dynamic.name"),
    customerAddress: t("templates.editor.dynamic.address"),
    customerEmail: t("templates.editor.dynamic.email"),
    customerNumber: t("templates.editor.dynamic.customerNumber"),
    net: t("templates.editor.dynamic.net"),
    vat: t("templates.editor.dynamic.vatAmount"),
    gross: t("templates.editor.dynamic.gross"),
  };
}

function renderTokenizedContent(content: string | undefined, labels: Record<string, string>) {
  if (!content) return "";

  return content.split(/({{\s*[^{}]+?\s*}})/g).map((part, index) => {
    const match = part.match(/^{{\s*([^{}]+?)\s*}}$/);
    if (!match) return part;

    const key = match[1].trim();
    return (
      <span
        key={index}
        className="inline-flex items-center rounded-md bg-[#eef2ff] px-1.5 py-[1px] font-bold leading-none text-[#4f46e5]"
      >
        {labels[key] ?? key}
      </span>
    );
  });
}

export function CanvasElement({
  element,
  invoice,
  selected = false,
  editable = false,
  highlightTokens = false,
  onSelect,
  onMouseDown,
  onResizeStart,
  onDelete,
}: {
  element: DocumentElement;
  invoice: PreviewInvoice;
  selected?: boolean;
  editable?: boolean;
  highlightTokens?: boolean;
  onSelect?: (id: string) => void;
  onMouseDown?: (e: ReactMouseEvent<Element>, id: string) => void;
  onResizeStart?: (e: ReactMouseEvent<Element>, id: string) => void;
  onDelete?: (id: string) => void;
}) {
  const { t } = useLanguage();
  const labels = tokenLabels(t);

  const style: React.CSSProperties = {
    position: "absolute",
    left: element.x,
    top: element.y,
    width: element.width,
    height: element.height,
    border: editable && selected ? "2px solid #84cc16" : undefined,
    color: element.color ?? "#000",
    backgroundColor: element.backgroundColor ?? "transparent",
    fontSize: element.fontSize,
    fontWeight: element.fontWeight,
    fontFamily: element.fontFamily,
    textAlign: element.align ?? "left",
    whiteSpace: "pre-line",
    padding: 2,
    cursor: editable ? "move" : "default",
    userSelect: editable ? "none" : "text",
  };

  const content =
    element.type === "line" ? (
      <div style={{ width: "100%", height: 1, backgroundColor: element.color ?? "#000" }} />
    ) : element.type === "logo" ? (
      <div style={{ width: "100%", height: "100%", backgroundColor: element.backgroundColor ?? "#eee" }} />
    ) : element.type === "box" ? (
      <div className="h-full w-full border border-dashed border-red-100 bg-transparent text-[10px] font-semibold text-red-100">
        {element.content}
      </div>
    ) : element.type === "paymentQr" ? (
      <div className="flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-400 bg-white p-2 text-center text-[10px] font-bold text-slate-700">
        <div className="grid h-[72%] w-[72%] grid-cols-5 grid-rows-5 gap-[2px]">
          {Array.from({ length: 25 }).map((_, index) => (
            <span
              key={index}
              className={(index * 7) % 3 === 0 ? "bg-slate-900" : "bg-slate-200"}
            />
          ))}
        </div>
      </div>
    ) : element.type === "text" && highlightTokens ? (
      renderTokenizedContent(element.content, labels)
    ) : (
      element.content
    );

  return (
    <div
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(element.id);
      }}
      onMouseDown={(e) => {
        if (!editable) return;
        e.stopPropagation();
        onMouseDown?.(e as ReactMouseEvent<Element>, element.id);
      }}
    >
      {content}

      {editable && selected && (
        <>
          <div className="absolute -top-9 left-0 flex items-center gap-2 rounded-full border border-black bg-black px-3 py-1.5 text-[11px] font-black text-[var(--brand-lime)] shadow-[0_12px_28px_rgba(0,0,0,0.32)]">
            <span>▦</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(element.id);
              }}
              className="rounded px-1 text-[var(--brand-lime)] hover:bg-white/10"
              title={t("templates.editor.canvas.delete")}
            >
              🗑
            </button>
          </div>

          {element.type !== "text" && (
            <div
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart?.(e as ReactMouseEvent<Element>, element.id);
              }}
              className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-sm border border-black/40 bg-lime-400 shadow"
              title={t("templates.editor.canvas.resize")}
            />
          )}
        </>
      )}
    </div>
  );
}
