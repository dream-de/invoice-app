"use client"

import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import {
  BarChart3,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Download,
  FileText,
  Filter,
  LayoutGrid,
  Mail,
  Pause,
  Play,
  Plus,
  Save,
  Search,
  Settings,
  ShieldCheck,
  TimerReset,
  User,
  Users
} from "lucide-react"
import styles from "./TimeTrackingPage.module.css"

type ThemeMode = "dark" | "light"
type PageKey =
  | "modules"
  | "weekly-entry"
  | "reports"
  | "weekly-report"
  | "worktimes"
  | "contract"
  | "project-details"
  | "project-users"
  | "project-activities"
  | "export"
  | "users"
  | "user-create"
  | "user-detail"
  | "user-menu"

const pages: Array<{ key: PageKey; label: string; icon: typeof LayoutGrid }> = [
  { key: "modules", label: "Zeiterfassung", icon: LayoutGrid },
  { key: "weekly-entry", label: "Wochenstunden", icon: Clock3 },
  { key: "reports", label: "Berichte", icon: BarChart3 },
  { key: "weekly-report", label: "Wochenbericht", icon: FileText },
  { key: "worktimes", label: "Arbeitszeiten", icon: CalendarDays },
  { key: "contract", label: "Arbeitsvertrag", icon: BriefcaseBusiness },
  { key: "project-details", label: "Projektdetails", icon: BarChart3 },
  { key: "project-users", label: "Projekt Benutzer", icon: Users },
  { key: "project-activities", label: "Tätigkeiten", icon: Clock3 },
  { key: "export", label: "Export", icon: Download },
  { key: "users", label: "Benutzer", icon: Users },
  { key: "user-create", label: "Benutzer erstellen", icon: Plus },
  { key: "user-detail", label: "Benutzerprofil", icon: User },
  { key: "user-menu", label: "Bearbeiten", icon: Settings }
]

const weekDays = ["MO. 01", "DI. 02", "MI. 03", "DO. 04", "FR. 05", "SA. 06", "SO. 07"]
const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"]
const projects = ["Konfiguration UniFi Netzwerk", "YouTube Kanal", "Migration VMWare to Proxmox"]
const activities = ["Kundengespräch", "Erstellung YouTube Videos", "Planung"]
const users = [
  { initials: "AD", name: "admin", color: "#b90ed7" },
  { initials: "LM", name: "lisa.mustermann", color: "#ffd5a8" }
]

function minutesFromClock(value: string) {
  const [hours = "0", minutes = "0"] = value.split(":")
  const parsedHours = Number(hours)
  const parsedMinutes = Number(minutes)
  if (!Number.isFinite(parsedHours) || !Number.isFinite(parsedMinutes)) return 0
  return Math.max(0, parsedHours * 60 + parsedMinutes)
}

function clockFromMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60
  return `${hours}:${String(minutes).padStart(2, "0")}`
}

function addClock(value: string, extraSeconds: number) {
  return clockFromMinutes(minutesFromClock(value) + Math.round(extraSeconds / 60))
}

function formatTimer(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":")
}

function Badge({ children }: { children: ReactNode }) {
  return <span className={styles.badge}>{children}</span>
}

function SelectBox({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <button type="button" className={wide ? styles.selectWide : styles.selectBox}>{children}<ChevronDown size={15} /></button>
}

function Donut({ mode }: { mode: "purple" | "split" }) {
  return <div className={mode === "purple" ? styles.donutPurple : styles.donutSplit} aria-hidden="true" />
}

function Chart({ bars = false, budget = false }: { bars?: boolean; budget?: boolean }) {
  return (
    <div className={styles.chart}>
      <div className={styles.chartGrid}>
        {Array.from({ length: 10 }).map((_, index) => <span key={index} />)}
      </div>
      {budget ? <div className={styles.budgetLine}><i /><i /><i /><i /><b /><b /><b /><b /><b /><b /><b /><b /></div> : null}
      {bars ? <><div className={styles.mayBar} /><div className={styles.juneBar} /></> : null}
      <div className={styles.chartMonths}>{months.map((month) => <small key={month}>{month}</small>)}</div>
    </div>
  )
}

function TopTimer({
  running,
  seconds,
  onToggle,
  onReset
}: {
  running: boolean
  seconds: number
  onToggle: () => void
  onReset: () => void
}) {
  return (
    <div className={styles.liveTimer}>
      <button type="button" onClick={onToggle} className={running ? styles.timerRunning : ""} aria-label={running ? "Timer pausieren" : "Timer starten"}>
        {running ? <Pause size={16} /> : <Play size={16} />}
        {formatTimer(seconds)}
      </button>
      <button type="button" onClick={onReset} aria-label="Timer zurücksetzen"><TimerReset size={16} /></button>
      <span>AD</span>
      <strong>Admin Benutzer</strong>
    </div>
  )
}

export function TimeTrackingPageClient({ initialTheme }: { initialTheme: ThemeMode }) {
  const [activePage, setActivePage] = useState<PageKey>("modules")
  const [timerRunning, setTimerRunning] = useState(false)
  const [timerSeconds, setTimerSeconds] = useState(0)
  const [exportStatus, setExportStatus] = useState("")
  const [selectedYear, setSelectedYear] = useState("2026")
  const [worktimeValues, setWorktimeValues] = useState<Record<string, string>>({ "5-13": "2:00", "6-1": "5:04" })
  const [weeklyRows, setWeeklyRows] = useState([
    { project: projects[0], activity: activities[0], days: ["3:00", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00"] },
    { project: projects[0], activity: activities[0], days: ["5:00", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00"] },
    { project: projects[1], activity: activities[1], days: ["5:04", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00"] },
    { project: projects[2], activity: activities[2], days: ["0:00", "0:00", "0:00", "0:00", "0:00", "0:00", "0:00"] }
  ])

  useEffect(() => {
    if (!timerRunning) return
    const interval = window.setInterval(() => setTimerSeconds((current) => current + 1), 1000)
    return () => window.clearInterval(interval)
  }, [timerRunning])

  const liveClock = addClock("0:00", timerSeconds)
  const liveDayClock = addClock(worktimeValues["6-1"] ?? "0:00", timerSeconds)
  const weeklyDayTotal = addClock(clockFromMinutes(weeklyRows.reduce((sum, row) => sum + minutesFromClock(row.days[0]), 0)), timerSeconds)
  const weeklyTotal = addClock(clockFromMinutes(weeklyRows.reduce((sum, row) => sum + row.days.reduce((daySum, item) => daySum + minutesFromClock(item), 0), 0)), timerSeconds)
  const reportTotal = weeklyTotal
  const activeTitle = useMemo(() => pages.find((page) => page.key === activePage)?.label ?? "Zeiterfassung", [activePage])

  function setWeeklyCell(rowIndex: number, dayIndex: number, value: string) {
    setWeeklyRows((current) => current.map((row, index) => index === rowIndex ? { ...row, days: row.days.map((day, itemIndex) => itemIndex === dayIndex ? value : day) } : row))
  }

  function setWorktimeCell(monthIndex: number, day: number, value: string) {
    setWorktimeValues((current) => ({ ...current, [`${monthIndex + 1}-${day}`]: value }))
  }

  function downloadExport(format: "csv" | "xls" | "pdf" | "xml" | "json") {
    setExportStatus("")
    window.location.href = `/api/time-tracking/export?format=${format}`
  }

  function printExport() {
    setExportStatus("")
    window.open("/api/time-tracking/export?format=print", "_blank", "noopener,noreferrer")
  }

  async function markExported() {
    setExportStatus("Markiere Zeiten ...")
    try {
      const response = await fetch("/api/time-tracking/export", { method: "POST" })
      const payload = await response.json() as { ok?: boolean; marked?: number; error?: string }
      if (!response.ok || !payload.ok) throw new Error(payload.error || "Exportstatus konnte nicht gespeichert werden.")
      setExportStatus(`${payload.marked ?? 0} Zeiten als exportiert markiert.`)
    } catch (error) {
      setExportStatus(error instanceof Error ? error.message : "Exportstatus konnte nicht gespeichert werden.")
    }
  }

  function renderModules() {
    const cards = [
      ["Meine Zeiten", Clock3, "#b90ed7", "weekly-report"],
      ["Wochenstunden", LayoutGrid, "#087bd3", "weekly-entry"],
      ["Manuelle Zeiten", FileText, "#18a765", "weekly-entry"],
      ["Alle Zeiten / Benutzerzeiten", Users, "#e61c5d", "users"],
      ["Berichte", BarChart3, "#87c33c", "reports"],
      ["Arbeitszeiten", BriefcaseBusiness, "#f0a900", "worktimes"],
      ["Benutzer-Arbeitsvertrag", ShieldCheck, "#777", "contract"],
      ["Export", Download, "#444", "export"]
    ] as const
    return <section className={styles.cardGrid}>{cards.map(([label, Icon, color, target]) => <button key={label} type="button" className={styles.moduleCard} onClick={() => setActivePage(target)}><span style={{ color }}><Icon size={26} /></span><strong>{label}</strong></button>)}</section>
  }

  function renderWeeklyEntry() {
    return (
      <section className={styles.panel}>
        <div className={styles.toolbar}><button type="button"><ChevronLeft size={18} /></button><SelectBox>Juni 2026 - KW 23</SelectBox><button type="button"><ChevronRight size={18} /></button><SelectBox>Admin Benutzer</SelectBox></div>
        <div className={styles.weekTable}>
          <div className={styles.weekHead}><b>PROJEKT</b><b>TÄTIGKEIT</b>{weekDays.map((day) => <b key={day}>{day}</b>)}<b>DAUER</b></div>
          {weeklyRows.map((row, rowIndex) => {
            const rowTotal = clockFromMinutes(row.days.reduce((sum, item) => sum + minutesFromClock(item), 0))
            return <div className={styles.weekRow} key={rowIndex}><SelectBox wide>{row.project}</SelectBox><SelectBox wide>{row.activity}</SelectBox>{weekDays.map((day, dayIndex) => <input key={day} value={row.days[dayIndex]} onChange={(event) => setWeeklyCell(rowIndex, dayIndex, event.target.value)} aria-label={`${row.project} ${day}`} />)}<strong>{rowTotal}</strong></div>
          })}
          {timerSeconds ? <div className={styles.weekRow}><SelectBox wide>Live Timer</SelectBox><SelectBox wide>Aktive Erfassung</SelectBox>{weekDays.map((day, index) => <input key={day} readOnly value={index === 0 ? liveClock : "0:00"} />)}<strong>{liveClock}</strong></div> : null}
          <div className={styles.totalRow}><strong>Gesamt</strong><span />{weekDays.map((day, index) => <b key={day}>{index === 0 ? weeklyDayTotal : "0:00"}</b>)}<b>{weeklyTotal}</b></div>
        </div>
        <div className={styles.actions}><button type="button" className={styles.primary}><Save size={16} />Speichern</button><button type="button" className={styles.success}><Plus size={16} />Hinzufügen</button></div>
      </section>
    )
  }

  function renderReports() {
    const reportCards = [
      "Wochenansicht für einen Benutzer",
      "Monatsansicht für einen Benutzer",
      "Jahresansicht für einen Benutzer",
      "Wochenansicht für alle Benutzer",
      "Monatsansicht für alle Benutzer",
      "Jahresansicht für alle Benutzer",
      "Projektdetails",
      "Projektübersicht",
      "Monatsauswertung",
      "Inaktive Projekte",
      "Projekte nach Monat, Tätigkeit und Benutzer"
    ]
    return <section className={styles.reportGrid}>{reportCards.map((label, index) => {
      const target: PageKey = index === 0 ? "weekly-report" : index === 6 ? "project-details" : index === 10 ? "project-activities" : "project-users"
      return <button type="button" key={label} className={styles.reportCard} onClick={() => setActivePage(target)}><span>{index < 6 ? <Users size={23} /> : <BriefcaseBusiness size={23} />}</span><strong>{label}</strong></button>
    })}</section>
  }

  function renderWeeklyReport() {
    const rows = [
      ["Mustermann GmbH", reportTotal, "#1bc5d7"],
      ["YouTube Kanal", "5:04", "#b7e2ec"],
      ["Erstellung YouTube Videos", "5:04", "#b6b6b6"],
      ["Konfiguration UniFi Netzwerk", "8:00", "#ffd200"],
      ["Kundengespräch", "8:00", "#2086d7"]
    ]
    return (
      <section className={styles.panel}>
        <p className={styles.breadcrumb}>Berichte › Wochenansicht für einen Benutzer</p>
        <div className={styles.toolbar}><button type="button"><ChevronLeft size={18} /></button><SelectBox>Juni 2026 - KW 23</SelectBox><button type="button"><ChevronRight size={18} /></button><SelectBox wide>Admin Benutzer</SelectBox><button type="button"><Download size={17} /></button></div>
        <div className={styles.reportTable}>
          <div className={styles.reportHead}><b /><b>GESAMT</b>{weekDays.map((day) => <b key={day}>{day}</b>)}</div>
          {rows.map(([label, total, color]) => <div key={label} className={styles.reportRow}><strong><i style={{ background: color }} />{label}</strong><b>{total}</b>{weekDays.map((day, index) => <span key={day}>{index === 0 ? total : "0:00"}</span>)}</div>)}
          <div className={styles.reportTotal}><strong>Gesamt</strong><b>{reportTotal}</b>{weekDays.map((day, index) => <b key={day}>{index === 0 ? weeklyDayTotal : "0:00"}</b>)}</div>
        </div>
      </section>
    )
  }

  function renderWorktimes() {
    const dayNumbers = Array.from({ length: 31 }, (_, index) => index + 1)
    return (
      <section className={styles.panel}>
        <div className={styles.toolbar}><button type="button"><ChevronLeft size={18} /></button><select className={styles.nativeSelect} value={selectedYear} onChange={(event) => setSelectedYear(event.target.value)}><option>2025</option><option>2026</option><option>2027</option></select><button type="button"><ChevronRight size={18} /></button><SelectBox>Admin Benutzer</SelectBox></div>
        <div className={styles.worktimeTable}>
          <div className={styles.worktimeHead}><b /><b>MONAT</b><b>GESAMT</b><b>ERWARTETE STUNDEN</b><b>GELEISTETE STUNDEN</b>{dayNumbers.map((day) => <b key={day}>{String(day).padStart(2, "0")}</b>)}</div>
          {months.map((month, index) => {
            const isPastWorkMonth = index < 4
            const currentMonthValues = dayNumbers.map((day) => {
              const key = `${index + 1}-${day}`
              const stored = worktimeValues[key] ?? ""
              return index === 5 && day === 1 ? liveDayClock : stored
            })
            const monthMinutes = currentMonthValues.reduce((sum, item) => sum + minutesFromClock(item), 0)
            const expected = isPastWorkMonth ? "176:00" : index === 4 ? "168:00" : index === 5 ? "8:00" : "0:00"
            const worked = monthMinutes ? clockFromMinutes(monthMinutes) : index === 4 ? "173:00" : index === 5 ? liveDayClock : "0:00"
            const balance = isPastWorkMonth ? "-176:00" : index === 4 ? "+5:00" : index === 5 ? `+${liveDayClock}` : "0:00"
            return <div key={month} className={styles.worktimeRow}><span>▣</span><strong>{month}</strong><b className={isPastWorkMonth ? styles.negative : index < 6 ? styles.positive : ""}>{balance}</b><span>{expected}</span><span>{worked}</span>{dayNumbers.map((day) => {
              const missing = isPastWorkMonth && ![3, 4, 10, 16, 17, 24, 25, 30, 31].includes(day)
              const key = `${index + 1}-${day}`
              const value = index === 5 && day === 1 ? liveDayClock : worktimeValues[key] ?? (missing ? "-8:00" : "")
              return <input key={day} className={missing ? styles.missingInput : ""} value={value} onChange={(event) => setWorktimeCell(index, day, event.target.value)} aria-label={`${month} ${day}`} />
            })}</div>
          })}
        </div>
        <div className={styles.expectedHours}>Erwartete Stunden <Badge>40:00</Badge></div>
      </section>
    )
  }

  function renderContract() {
    return (
      <section className={styles.userProfile}>
        <div className={styles.userHeader}><span>AD</span><strong>Admin Benutzer</strong><div><button type="button">Benachrichtigungen</button><button type="button"><Mail size={17} />E-Mail</button></div></div>
        <div className={styles.tabs}>{["Profil", "Einstellungen", "Passwort", "Zwei-Faktor (2FA)", "API-Zugang", "Teams", "Rollen", "Arbeitsvertrag"].map((tab) => <button key={tab} className={tab === "Arbeitsvertrag" ? styles.tabActive : ""} type="button">{tab}</button>)}</div>
        <div className={styles.contractForm}><h2>Erwartete Stunden</h2><label>Arbeitszeitberechnung *<SelectBox wide>Stunden pro Tag</SelectBox></label>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day, index) => <label key={day}>{day}<input readOnly value={index < 5 ? "8:00" : "0:00"} /></label>)}<button type="button" className={styles.primary}><Save size={16} />Speichern</button></div>
      </section>
    )
  }

  function renderProjectReport(mode: "details" | "users" | "activities") {
    return (
      <section className={styles.panel}>
        <p className={styles.breadcrumb}>Berichte › Projekte</p>
        <div className={styles.topActions}><button type="button">Anzeigen</button><button type="button">Bearbeiten</button><button type="button">Berechtigungen</button><button type="button"><Filter size={16} />Daten filtern</button></div>
        <SelectBox wide>Migration VMWare to Proxmox</SelectBox>
        <div className={styles.projectPanel}>
          <div className={styles.projectHead}><strong><i />Migration VMWare to Proxmox</strong><div className={styles.tabs}>{["Projektdetails", "Benutzer", "Tätigkeit"].map((tab) => {
            const target: PageKey = tab === "Projektdetails" ? "project-details" : tab === "Benutzer" ? "project-users" : "project-activities"
            return <button key={tab} className={(mode === "details" && tab === "Projektdetails") || (mode === "users" && tab === "Benutzer") || (mode === "activities" && tab === "Tätigkeit") ? styles.tabActive : ""} type="button" onClick={() => setActivePage(target)}>{tab}</button>
          })}</div><Badge>{addClock("99:00", timerSeconds)}</Badge><Badge>0,00 €</Badge></div>
          {mode === "details" ? <div className={styles.projectDetails}><div><b>KUNDE</b><p><i className={styles.cyanDot} />Mustermann GmbH</p><b>GESAMT</b><p>99:00</p><b>ABRECHENBAR</b><p>0,00 €</p><b>NICHT EXPORTIERT</b><p className={styles.linkBlue}>99:00</p></div><div><b>PROJEKT</b><p><i />Migration VMWare to Proxmox</p><b>UMSATZ GESAMT</b><p>0,00 €</p><b>LETZTER EINTRAG</b><p>29.05.2026</p><b>NICHT ABGERECHNET</b><p className={styles.linkBlue}>0,00 €</p></div><div><h3>Stundenkontingent</h3><Chart budget /></div></div> : <div className={styles.projectSplit}><div className={styles.smallReportTable}>{(mode === "users" ? [["Admin Benutzer", "99:00", "100.0 %", "#b90ed7"]] : [["Planung", "73:00", "73.7 %", "#f0180a"], ["Kundengespräch", "26:00", "26.3 %", "#087bd3"]]).map(([label, hours, percent, color]) => <p key={label}><span><i style={{ background: color }} />{label}</span><b>{hours}</b><em>0,00 €</em><strong>{percent}</strong></p>)}<footer><b>99:00</b><b>0,00 €</b><b>0,00 €</b></footer></div><Donut mode={mode === "users" ? "purple" : "split"} /></div>}
        </div>
        <div className={styles.projectChartPanel}><div className={styles.projectHead}><strong>{selectedYear}</strong><div className={styles.tabs}><button className={styles.tabActive} type="button">Arbeitszeit</button><button type="button">Umsatz</button><button type="button">Benutzer</button><button type="button">Tätigkeit</button></div><Badge>{addClock("99:00", timerSeconds)}</Badge><Badge>0,00 €</Badge></div><Chart bars /></div>
      </section>
    )
  }

  function renderExport() {
    const entries = ["5:00", "0:01", "0:02", "0:01"]
    return (
      <section className={styles.panel}>
        <div className={styles.exportTitle}>Export <Badge>{addClock("5:04", timerSeconds)}</Badge><Badge>0,00 €</Badge></div>
        <div className={styles.exportFilter}><h2>Daten für Export filtern</h2>{["Schlagworte", "Benutzer", "Abrechenbar *", "Exportiert *", "Zeiten *"].map((label, index) => <label key={label}>{label}<SelectBox wide>{index === 2 ? "Alle" : index === 3 ? "Nein" : index === 4 ? "Beendete" : ""}</SelectBox></label>)}<div className={styles.actions}><button type="button">☆ Speichern</button><button type="button">×</button><button type="button" className={styles.primary}><Search size={16} />Suchen</button></div></div>
        <div className={styles.preview}><h2>Vorschau</h2><div className={styles.previewSummary}><strong><i className={styles.cyanDot} />Mustermann GmbH</strong><span>{addClock("5:04", timerSeconds)}</span><span>0,00 €</span></div><label className={styles.switchLine}><input type="checkbox" />Als exportiert markieren</label><div className={styles.exportButtons}><button type="button" onClick={() => downloadExport("csv")}>CSV</button><button type="button" onClick={() => downloadExport("xls")}>Excel</button><button type="button" onClick={() => downloadExport("pdf")}>PDF</button><button type="button" onClick={() => downloadExport("xml")}>XML</button><button type="button" onClick={() => downloadExport("json")}>JSON</button><button type="button" onClick={printExport}>Drucken</button><button type="button" onClick={markExported}>Als exportiert markieren</button></div>{exportStatus ? <p className={styles.exportStatus}>{exportStatus}</p> : null}<div className={styles.exportRows}>{entries.map((duration, index) => <p key={index}><span className={styles.avatar}>AD</span><span>01.06.2026</span><strong><i />YouTube Kanal<br /><em>Mustermann GmbH</em></strong><span>{index === 0 ? addClock(duration, timerSeconds) : duration}</span><span>0,00 €</span><button type="button">Offen</button></p>)}</div></div>
      </section>
    )
  }

  function renderUsers() {
    return (
      <section className={styles.panel}>
        <div className={styles.userListTop}><div><button type="button"><LayoutGrid size={20} /></button><button type="button"><Filter size={20} /></button><input placeholder="Suchen" /><button type="button"><Search size={17} /></button></div><div><button type="button" onClick={() => setActivePage("user-create")}><Plus size={17} />Erstellen</button><button type="button"><Download size={17} />Export</button><button type="button"><FileText size={17} />Bericht</button></div></div>
        <div className={styles.usersTable}><header><b>BENUTZER</b><b>TEAM</b></header>{users.map((item) => <p key={item.name}><span className={styles.avatar} style={{ background: item.color, color: item.initials === "LM" ? "#333" : "#fff" }}>{item.initials}</span><button type="button" className={styles.userNameButton} onClick={() => setActivePage("user-detail")}>{item.name}</button><em>0</em><button type="button" onClick={() => setActivePage("user-menu")}>...</button></p>)}<footer>Zeige die Einträge 1 bis 2 von insgesamt 2 an.<span>‹ <b>1</b> ›</span></footer></div>
      </section>
    )
  }

  function renderCreateUser() {
    return <><section className={styles.dimmed}>{renderUsers()}</section><div className={styles.createModal}><div className={styles.modalHeader}><h2>Erstellen</h2><button type="button" onClick={() => setActivePage("users")}>×</button></div><div className={styles.userCreateGrid}>{["Benutzer *", "E-Mail *", "Passwort *", "Passwort wiederholen *", "Name", "Titel", "Farbe", "Sprache *", "Zeitzone *", "Personalnummer", "Vorgesetzter", "Team", "Rolle", "Zeit-, Datums- und Währungsformat *"].map((field, index) => <label key={field} className={field === "Farbe" || field.startsWith("Zeit") ? styles.wideField : ""}>{field}<input readOnly value={field === "Sprache *" || field.startsWith("Zeit") ? "Deutsch" : field === "Zeitzone *" ? "Europe / Berlin" : ""} autoFocus={index === 0} /></label>)}</div><a>Hier finden Sie Beispiele für die Formatierungsregeln der unterstützten Sprachen</a>{["Aktiv", "System-Benutzer", "Neues Passwort anfordern"].map((label, index) => <label key={label} className={styles.switchLine}><input type="checkbox" defaultChecked={index === 0} />{label}</label>)}</div></>
  }

  function renderUserDetail(withMenu = false) {
    return (
      <section className={styles.userProfile}>
        <div className={styles.profileActions}><button type="button">Profil</button><button className={withMenu ? styles.tabActive : ""} type="button" onClick={() => setActivePage("user-menu")}>Bearbeiten</button><button type="button">Bericht</button><button type="button"><Filter size={16} />Daten filtern</button>{withMenu ? <div className={styles.editMenu}>{["Profil", "Einstellungen", "Passwort", "Zwei-Faktor (2FA)", "API-Zugang", "Teams", "Rollen", "Arbeitsvertrag"].map((item) => <button type="button" key={item} onClick={() => item === "Arbeitsvertrag" ? setActivePage("contract") : undefined}>{item}</button>)}</div> : null}</div>
        <div className={styles.userHeader}><span>AD</span><strong>Admin Benutzer</strong><div><button type="button">Benachrichtigungen</button><button type="button"><Mail size={17} />E-Mail</button></div></div>
        <div className={styles.userMeta}>{[["BENUTZER", "admin"], ["ERSTER ARBEITSTAG", "01.05.2026"], ["REGISTRIERT AM", "19.05.2026"], ["GESAMT", "186:04"], ["LETZTER MONAT", ""]].map(([label, value]) => <p key={label}><b>{label}</b><span>{value}</span></p>)}</div>
        <div className={styles.projectChartPanel}><div className={styles.exportTitle}>{selectedYear} <Badge>{addClock("186:04", timerSeconds)}</Badge></div><Chart bars /></div>
      </section>
    )
  }

  function renderPage() {
    if (activePage === "modules") return renderModules()
    if (activePage === "weekly-entry") return renderWeeklyEntry()
    if (activePage === "reports") return renderReports()
    if (activePage === "weekly-report") return renderWeeklyReport()
    if (activePage === "worktimes") return renderWorktimes()
    if (activePage === "contract") return renderContract()
    if (activePage === "project-details") return renderProjectReport("details")
    if (activePage === "project-users") return renderProjectReport("users")
    if (activePage === "project-activities") return renderProjectReport("activities")
    if (activePage === "export") return renderExport()
    if (activePage === "users") return renderUsers()
    if (activePage === "user-create") return renderCreateUser()
    if (activePage === "user-detail") return renderUserDetail()
    return renderUserDetail(true)
  }

  return (
    <main className={styles.page} data-theme={initialTheme}>
      <header className={styles.header}>
        <div>
          <h1>{activeTitle}</h1>
          <p>Zeiterfassung im Kimai-Stil: Wochenstunden, Berichte, Export, Benutzer und Arbeitsmodell.</p>
        </div>
        {activePage !== "modules" ? <button type="button" className={styles.overviewButton} onClick={() => setActivePage("modules")}><LayoutGrid size={16} />Übersicht</button> : null}
        <TopTimer running={timerRunning} seconds={timerSeconds} onToggle={() => setTimerRunning((current) => !current)} onReset={() => { setTimerRunning(false); setTimerSeconds(0) }} />
      </header>
      {renderPage()}
    </main>
  )
}
