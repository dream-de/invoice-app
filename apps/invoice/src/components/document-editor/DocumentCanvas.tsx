"use client"

import { useRef, useState } from "react"
import type { MouseEvent as ReactMouseEvent } from "react"
import type { DocumentTemplate, PreviewInvoice } from "@/lib/document-templates/types"
import { renderPreviewElements } from "@/lib/document-preview/renderPreview"
import { CanvasElement } from "./CanvasElement"

export function DocumentCanvas({
  template,
  invoice,
  scale = 1,
  editable = false,
  selectedId,
  onSelectElement,
  onMoveElement,
  onResizeElement,
  onDeleteElement,
  selectedIds = [],
  onMoveMany,
  guideX = null,
  guideY = null,
  showGrid = false,
  gridSize = 10
}: {
  template: DocumentTemplate
  invoice: PreviewInvoice
  scale?: number
  editable?: boolean
  selectedId?: string
  onSelectElement?: (id: string) => void
  onMoveElement?: (id: string, x: number, y: number) => void
  onResizeElement?: (id: string, width: number, height: number) => void
  onDeleteElement?: (id: string) => void
  selectedIds?: string[]
  onMoveMany?: (items: Array<{ id: string; x: number; y: number }>) => void
  guideX?: number | null
  guideY?: number | null
  showGrid?: boolean
  gridSize?: number
}) {
  const pageRef = useRef<HTMLDivElement | null>(null)
  const [drag, setDrag] = useState<{ id: string; dx: number; dy: number } | null>(null)
  const [groupDrag, setGroupDrag] = useState<Array<{ id: string; dx: number; dy: number }> | null>(null)
  const [resize, setResize] = useState<{ id: string; sx: number; sy: number; sw: number; sh: number } | null>(null)

  const elements = renderPreviewElements(template, invoice)

  function startDrag(event: ReactMouseEvent<Element>, id: string) {
    if (!editable || !pageRef.current) return
    event.stopPropagation()

    const element = template.elements.find((item) => item.id === id)
    if (!element) return

    const rect = pageRef.current.getBoundingClientRect()

    const cx = (event.clientX - rect.left) / scale
    const cy = (event.clientY - rect.top) / scale

    const isMulti = selectedIds.includes(id) && selectedIds.length > 1
    if (isMulti) {
      const dragged = template.elements
        .filter((el) => selectedIds.includes(el.id))
        .map((el) => ({ id: el.id, dx: cx - el.x, dy: cy - el.y }))
      setGroupDrag(dragged)
    } else {
      setDrag({
        id,
        dx: cx - element.x,
        dy: cy - element.y
      })
    }

    onSelectElement?.(id)
  }

  function startResize(event: ReactMouseEvent<Element>, id: string) {
    if (!editable) return
    event.stopPropagation()

    const element = template.elements.find((item) => item.id === id)
    if (!element) return

    setResize({
      id,
      sx: event.clientX,
      sy: event.clientY,
      sw: element.width,
      sh: element.height
    })

    onSelectElement?.(id)
  }

  function move(event: ReactMouseEvent<HTMLDivElement>) {
    if (drag && pageRef.current) {
      const rect = pageRef.current.getBoundingClientRect()
      const x = (event.clientX - rect.left) / scale - drag.dx
      const y = (event.clientY - rect.top) / scale - drag.dy
      onMoveElement?.(drag.id, Math.round(x), Math.round(y))
    }

    if (groupDrag && pageRef.current && onMoveMany) {
      const rect = pageRef.current.getBoundingClientRect()
      const cx = (event.clientX - rect.left) / scale
      const cy = (event.clientY - rect.top) / scale
      onMoveMany(
        groupDrag.map((g) => ({
          id: g.id,
          x: Math.round(cx - g.dx),
          y: Math.round(cy - g.dy),
        }))
      )
    }

    if (resize) {
      const width = resize.sw + (event.clientX - resize.sx) / scale
      const height = resize.sh + (event.clientY - resize.sy) / scale
      onResizeElement?.(resize.id, Math.max(20, Math.round(width)), Math.max(10, Math.round(height)))
    }
  }

  function stopActions() {
    setDrag(null)
    setGroupDrag(null)
    setResize(null)
  }

  return (
    <div className="relative">
      <div className="h-6 w-full border-b border-slate-200 bg-white text-[10px] text-slate-400">
        {Array.from({ length: 34 }).map((_, index) => (
          <span key={index} className="inline-block w-8 text-center">
            {index * 10}
          </span>
        ))}
      </div>

      <div
        style={{
          width: template.page.width * scale,
          height: template.page.height * scale
        }}
      >
        <div
          ref={pageRef}
          className="relative bg-white shadow-2xl"
          style={{
            width: template.page.width,
            height: template.page.height,
            transform: `scale(${scale})`,
            transformOrigin: "top left"
          }}
          onClick={() => onSelectElement?.("")}
          onMouseMove={move}
          onMouseUp={stopActions}
          onMouseLeave={stopActions}
        >
          {guideX !== null && (
            <div
              className="pointer-events-none absolute top-0 bottom-0 w-px bg-lime-400/80"
              style={{ left: guideX }}
            />
          )}
          {guideY !== null && (
            <div
              className="pointer-events-none absolute left-0 right-0 h-px bg-lime-400/80"
              style={{ top: guideY }}
            />
          )}

          {showGrid && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "linear-gradient(to right, rgba(148,163,184,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(148,163,184,0.14) 1px, transparent 1px)",
                backgroundSize: `${gridSize}px ${gridSize}px`,
              }}
            />
          )}

          {elements.map((element) => (
            <CanvasElement
              key={element.id}
              element={element}
              invoice={invoice}
              selected={editable && selectedId === element.id}
              editable={editable}
              onSelect={onSelectElement}
              onMouseDown={startDrag}
              onResizeStart={startResize}
              onDelete={onDeleteElement}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
