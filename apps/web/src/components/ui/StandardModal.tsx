"use client"

import type { CSSProperties, MouseEvent, PointerEvent, ReactNode } from "react"
import { useEffect, useId, useRef, useState } from "react"
import { X } from "lucide-react"
import styles from "./StandardModal.module.css"

type StandardModalProps = {
  open?: boolean
  title: ReactNode
  eyebrow?: ReactNode
  description?: ReactNode
  icon?: ReactNode
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  ariaLabelledBy?: string
  width?: number | string
  className?: string
  bodyClassName?: string
  footerClassName?: string
  padded?: boolean
  closeLabel?: string
}

type DragStart = {
  pointerId: number
  startX: number
  startY: number
  originX: number
  originY: number
}

function firstFocusable(container: HTMLElement) {
  return container.querySelector<HTMLElement>(
    "input:not([type='hidden']):not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [href], [tabindex]:not([tabindex='-1'])"
  )
}

export function StandardModal({
  open = true,
  title,
  eyebrow,
  description,
  icon,
  children,
  footer,
  onClose,
  ariaLabelledBy,
  width,
  className,
  bodyClassName,
  footerClassName,
  padded = true,
  closeLabel = "Dialog schliessen"
}: StandardModalProps) {
  const generatedTitleId = useId()
  const titleId = ariaLabelledBy || generatedTitleId
  const bodyRef = useRef<HTMLDivElement | null>(null)
  const dialogRef = useRef<HTMLElement | null>(null)
  const dragRef = useRef<DragStart | null>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    if (!open) return
    setOffset({ x: 0, y: 0 })
    const frame = window.requestAnimationFrame(() => {
      const focusTarget = bodyRef.current ? firstFocusable(bodyRef.current) : null
      focusTarget?.focus()
    })

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }

    window.addEventListener("keydown", closeOnEscape)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("keydown", closeOnEscape)
    }
  }, [onClose, open])

  if (!open) return null

  function clampOffset(x: number, y: number) {
    const rect = dialogRef.current?.getBoundingClientRect()
    const width = rect?.width ?? 520
    const height = rect?.height ?? 280
    const maxX = Math.max(0, (window.innerWidth - Math.min(width, window.innerWidth)) / 2)
    const maxY = Math.max(0, (window.innerHeight - Math.min(height, window.innerHeight)) / 2)
    return {
      x: Math.min(maxX, Math.max(-maxX, x)),
      y: Math.min(maxY, Math.max(-maxY, y))
    }
  }

  function startDrag(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0 || window.innerWidth < 769) return
    const target = event.target as HTMLElement
    if (target.closest("button, input, select, textarea, a, label, [data-no-modal-drag]")) return
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    setOffset(clampOffset(
      drag.originX + event.clientX - drag.startX,
      drag.originY + event.clientY - drag.startY
    ))
  }

  function stopDrag(event: PointerEvent<HTMLElement>) {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  function closeFromBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) onClose()
  }

  const style = {
    "--standard-modal-width": typeof width === "number" ? width + "px" : width,
    "--standard-modal-x": offset.x + "px",
    "--standard-modal-y": offset.y + "px",
    transform: `translate(${offset.x}px, ${offset.y}px)`
  } as CSSProperties

  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={closeFromBackdrop}>
      <section
        ref={dialogRef}
        className={[styles.dialog, className].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={style}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header
          className={styles.header}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={stopDrag}
          onPointerCancel={stopDrag}
        >
          <div className={styles.titleGroup}>
            {eyebrow ? <span className={styles.eyebrow}>{eyebrow}</span> : null}
            <div className={styles.titleLine}>
              {icon}
              <h2 id={titleId}>{title}</h2>
            </div>
            {description ? <p className={styles.description}>{description}</p> : null}
          </div>
          <button type="button" className={styles.closeButton} aria-label={closeLabel} onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div ref={bodyRef} className={[styles.body, padded ? styles.bodyPadded : "", bodyClassName].filter(Boolean).join(" ")}>
          {children}
        </div>
        {footer ? <footer className={[styles.footer, footerClassName].filter(Boolean).join(" ")}>{footer}</footer> : null}
      </section>
    </div>
  )
}
