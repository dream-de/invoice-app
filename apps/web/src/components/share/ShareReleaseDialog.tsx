"use client"

import { useEffect, useMemo, useState } from "react"
import { CalendarDays, ChevronLeft, ChevronRight, Copy, Mail, QrCode, Share2, X } from "lucide-react"
import styles from "./ShareReleaseDialog.module.css"
import { StandardModal } from "@/components/ui/StandardModal"

type ShareReleaseDialogProps = {
  label?: string
  itemName: string
  itemUrl?: string
  onClose: () => void
}

type CalendarDay = {
  key: string
  date: Date
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function dateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return year + "-" + month + "-" + day
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date)
}

function formatMonth(date: Date) {
  return new Intl.DateTimeFormat("de-DE", { month: "long", year: "numeric" }).format(date)
}

function buildCalendarDays(monthDate: Date, selectedDate: Date): CalendarDay[] {
  const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1)
  const mondayOffset = (monthStart.getDay() + 6) % 7
  const first = new Date(monthStart)
  first.setDate(monthStart.getDate() - mondayOffset)
  const todayKey = dateKey(new Date())
  const selectedKey = dateKey(selectedDate)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(first)
    date.setDate(first.getDate() + index)
    const key = dateKey(date)
    return {
      key,
      date,
      inMonth: date.getMonth() === monthDate.getMonth(),
      isToday: key === todayKey,
      isSelected: key === selectedKey
    }
  })
}

async function copyText(value: string) {
  try {
    await navigator.clipboard?.writeText(value)
  } catch {
    const input = document.createElement("input")
    input.value = value
    input.setAttribute("readonly", "true")
    input.style.position = "fixed"
    input.style.opacity = "0"
    document.body.appendChild(input)
    input.select()
    document.execCommand("copy")
    input.remove()
  }
}

export function ShareReleaseDialog({ label = "Freigabe", itemName, itemUrl, onClose }: ShareReleaseDialogProps) {
  const defaultExpiry = useMemo(() => addDays(new Date(), 7), [])
  const [selectedDate, setSelectedDate] = useState(defaultExpiry)
  const [calendarMonth, setCalendarMonth] = useState(new Date(defaultExpiry.getFullYear(), defaultExpiry.getMonth(), 1))
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [selectedTime, setSelectedTime] = useState("09:45")
  const [security, setSecurity] = useState({ password: true, download: true, print: true })
  const [password, setPassword] = useState("dreaminvoice")
  const [shareLink, setShareLink] = useState("")
  const [status, setStatus] = useState("Nicht erstellt")
  const [qrVisible, setQrVisible] = useState(false)

  const calendarDays = useMemo(() => buildCalendarDays(calendarMonth, selectedDate), [calendarMonth, selectedDate])
  const expiry = shareLink ? formatDate(selectedDate) + ", " + selectedTime + " Uhr" : "Noch nicht gespeichert"

  useEffect(() => {
    const link = createLinkPreview()
    setShareLink(link)
    setStatus("Erstellt")
  }, [])

  function createShareLink() {
    const base = itemUrl || window.location.href
    const token = btoa(itemName + "-" + dateKey(selectedDate) + "-" + selectedTime + "-" + Date.now()).replace(/=+$/g, "").slice(0, 18)
    setShareLink(base + (base.includes("?") ? "&" : "?") + "share=" + token)
    setStatus("Erstellt")
    setQrVisible(true)
  }

  async function copyShareLink() {
    const link = shareLink || createLinkPreview()
    if (!shareLink) {
      setShareLink(link)
      setStatus("Erstellt")
    }
    await copyText(link)
    setStatus("Kopiert")
  }

  function createLinkPreview() {
    const base = itemUrl || window.location.href
    const token = btoa(itemName + "-" + dateKey(selectedDate) + "-" + selectedTime + "-" + Date.now()).replace(/=+$/g, "").slice(0, 18)
    return base + (base.includes("?") ? "&" : "?") + "share=" + token
  }

  function sendShareMail() {
    const link = shareLink || createLinkPreview()
    if (!shareLink) {
      setShareLink(link)
      setStatus("Erstellt")
    }
    const subject = encodeURIComponent("Freigabe: " + itemName)
    const body = encodeURIComponent("Hallo,\n\nhier ist der Freigabelink für " + itemName + ":\n" + link + "\n\nGültig bis: " + formatDate(selectedDate) + ", " + selectedTime + " Uhr")
    window.location.href = "mailto:?subject=" + subject + "&body=" + body
  }

  function selectDate(date: Date) {
    setSelectedDate(date)
    setCalendarOpen(false)
    if (shareLink) setStatus("Aktualisiert")
  }

  function moveMonth(direction: number) {
    setCalendarMonth((current) => new Date(current.getFullYear(), current.getMonth() + direction, 1))
  }

  function selectToday() {
    const today = new Date()
    setSelectedDate(today)
    setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
    setCalendarOpen(false)
  }

  return (
    <StandardModal
      title="Freigabe erstellen"
      eyebrow={label}
      onClose={onClose}
      ariaLabelledBy="share-release-title"
      width={720}
      bodyClassName={styles.body}
      padded={false}
      closeLabel="Dialog schließen"
    >
          <section className={styles.section}>
            <div className={styles.sectionTitle}>
              <h3>Link-Einstellungen</h3>
              <span data-status={status === "Nicht erstellt" ? "draft" : "active"}>{status}</span>
            </div>

            <div className={styles.formGrid}>
              <span>Datei</span>
              <strong>{itemName}</strong>

              <label htmlFor="share-link">Freigabelink</label>
              <input id="share-link" readOnly value={shareLink || "Noch kein Freigabelink erzeugt"} onFocus={(event) => event.currentTarget.select()} />
            </div>

            <div className={styles.iconActions} aria-label="Freigabe Aktionen">
              <button type="button" aria-label="Link erzeugen" title="Link erzeugen" onClick={createShareLink}><Share2 size={16} /></button>
              <button type="button" aria-label="Link kopieren" title="Link kopieren" onClick={() => void copyShareLink()}><Copy size={16} /></button>
              <button type="button" aria-label="Per E-Mail teilen" title="Per E-Mail teilen" onClick={sendShareMail}><Mail size={16} /></button>
              <button type="button" aria-label="QR-Code anzeigen" title="QR-Code anzeigen" onClick={() => {
                if (!shareLink) setShareLink(createLinkPreview())
                setQrVisible((visible) => !visible)
                setStatus("Erstellt")
              }}><QrCode size={16} /></button>
            </div>
          </section>

          <section className={styles.section}>
            <label className={styles.checkRow}>
              <input type="checkbox" checked={security.password} onChange={(event) => setSecurity((current) => ({ ...current, password: event.target.checked }))} />
              Sichere Freigabe aktivieren
            </label>

            <div className={styles.formGrid}>
              <label htmlFor="share-date">Gültig bis</label>
              <div className={styles.dateField}>
                <button type="button" id="share-date" onClick={() => setCalendarOpen((open) => !open)}>
                  <CalendarDays size={16} />
                  <span>{formatDate(selectedDate)}</span>
                </button>
                {calendarOpen ? (
                  <div className={styles.calendar} role="dialog" aria-label="Ablaufdatum wählen">
                    <div className={styles.calendarHead}>
                      <button type="button" aria-label="Vorheriger Monat" onClick={() => moveMonth(-1)}><ChevronLeft size={14} /></button>
                      <strong>{formatMonth(calendarMonth)}</strong>
                      <button type="button" aria-label="Nächster Monat" onClick={() => moveMonth(1)}><ChevronRight size={14} /></button>
                    </div>
                    <div className={styles.weekdays}>
                      {["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"].map((day) => <span key={day}>{day}</span>)}
                    </div>
                    <div className={styles.days}>
                      {calendarDays.map((day) => (
                        <button key={day.key} type="button" data-muted={!day.inMonth} data-today={day.isToday} data-selected={day.isSelected} onClick={() => selectDate(day.date)}>
                          {day.date.getDate()}
                        </button>
                      ))}
                    </div>
                    <div className={styles.calendarFoot}>
                      <button type="button" onClick={selectToday}>Heute</button>
                      <label>
                        Zeit
                        <input type="time" value={selectedTime} onChange={(event) => setSelectedTime(event.target.value)} />
                      </label>
                    </div>
                  </div>
                ) : null}
              </div>

              <label htmlFor="share-password">Passwort</label>
              <input id="share-password" type={security.password ? "password" : "text"} value={password} disabled={!security.password} onChange={(event) => setPassword(event.target.value)} />
            </div>

            <div className={styles.permissions}>
              <label><input type="checkbox" checked={security.download} onChange={(event) => setSecurity((current) => ({ ...current, download: event.target.checked }))} />Download erlauben</label>
              <label><input type="checkbox" checked={security.print} onChange={(event) => setSecurity((current) => ({ ...current, print: event.target.checked }))} />Drucken erlauben</label>
            </div>
          </section>

          {qrVisible ? (
            <section className={styles.qrPreview} aria-label="QR Code Vorschau">
              <div>
                {Array.from({ length: 25 }).map((_, index) => <i key={index} data-on={Boolean(shareLink) && (index % 2 === 0 || index % 7 === 0 || shareLink.length % (index + 2) === 0)} />)}
              </div>
              <strong>QR-Code sichtbar</strong>
            </section>
          ) : null}

          <div className={styles.footer}>
            <span>Gültig bis {expiry}</span>
            <div>
              <button type="button" onClick={onClose}>Abbrechen</button>
              <button type="button" onClick={createShareLink}>Speichern</button>
            </div>
          </div>
    </StandardModal>
  )
}
