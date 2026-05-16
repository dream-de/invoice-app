"use client";

import type { MouseEvent as ReactMouseEvent } from "react";
import type { DocumentElement, PreviewInvoice } from "@/lib/document-templates/types";

export function CanvasElement({
  element,
  invoice,
  selected = false,
  editable = false,
  onSelect,
  onMouseDown,
  onResizeStart,
  onDelete,
}: {
  element: DocumentElement;
  invoice: PreviewInvoice;
  selected?: boolean;
  editable?: boolean;
  onSelect?: (id: string) => void;
  onMouseDown?: (e: ReactMouseEvent<Element>, id: string) => void;
  onResizeStart?: (e: ReactMouseEvent<Element>, id: string) => void;
  onDelete?: (id: string) => void;
}) {
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
        <span className="mt-1">SEPA QR</span>
      </div>
    ) : (
      element.content
    );

  return (
    <div
      style={style}
      onClick={() => onSelect?.(element.id)}
      onMouseDown={(e) => {
        if (!editable) return;
        e.stopPropagation();
        onMouseDown?.(e as ReactMouseEvent<Element>, element.id);
      }}
    >
      {content}

      {editable && selected && (
        <>
          <div className="absolute -top-9 left-0 flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 text-[11px] text-slate-700 shadow-lg">
            <span>⋮⋮</span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(element.id);
              }}
              className="rounded px-1 hover:bg-slate-100"
              title="Löschen"
            >
              🗑
            </button>
          </div>

          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              onResizeStart?.(e as ReactMouseEvent<Element>, element.id);
            }}
            className="absolute -bottom-1.5 -right-1.5 h-4 w-4 cursor-se-resize rounded-sm border border-black/40 bg-lime-400 shadow"
            title="Größe ändern"
          />
        </>
      )}
    </div>
  );
}
