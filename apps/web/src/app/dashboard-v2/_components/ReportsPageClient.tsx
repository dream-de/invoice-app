"use client"

import { useMemo, useState } from "react"
import { BarChart3, CalendarDays, Check, ClipboardList, Download, Euro, FileText, TrendingUp } from "lucide-react"
import styles from "./ReportsLogs.module.css"

const kpis = [
  { title: "Umsatz", value: "124.580 EUR", trend: "+12%", icon: Euro },
  { title: "Angebote", value: "58", trend: "+8%", icon: FileText },
  { title: "Rechnungen", value: "156", trend: "+15%", icon: ClipboardList },
  { title: "Offene Rechnungen", value: "28.450 EUR", trend: "-4%", icon: TrendingUp, danger: true }
]

const reports = [
  { key: "month", title: "Monatsbericht", description: "Umsatz, Rechnungen und Zahlungseingaenge" },
  { key: "year", title: "Jahresbericht", description: "Jahresvergleich und Entwicklung" },
  { key: "tax", title: "Steuerbericht", description: "Steuerrelevante Summen und Exporte" },
  { key: "project", title: "Projektbericht", description: "Projektzeiten, Budgets und Status" },
  { key: "customer", title: "Kundenbericht", description: "Top Kunden, Umsatz und Aktivitaet" },
  { key: "user", title: "Benutzerbericht", description: "Nutzung und Team-Aktivitaeten" }
] as const

const customers = ["Acme GmbH", "Nordhandel GmbH", "Tech Solutions", "Design Studio"]
const activityBars = [45, 38, 62, 70, 43, 52, 40]

function formatDisplayDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(`${value}T00:00:00`))
}

function toCsv(rows: Array<Record<string, string>>) {
  const headers = Object.keys(rows[0] ?? {})
  const values = rows.map((row) => headers.map((header) => `"${String(row[header] ?? "").replaceAll('"', '""')}"`).join(";"))
  return [headers.join(";"), ...values].join("\n")
}

export function ReportsPageClient({ theme = "light" }: { theme?: "dark" | "light" }) {
  const [dateFrom, setDateFrom] = useState("2026-06-01")
  const [dateTo, setDateTo] = useState("2026-06-26")
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [activeReport, setActiveReport] = useState<(typeof reports)[number]["key"]>("month")

  const activeReportDetails = useMemo(
    () => reports.find((report) => report.key === activeReport) ?? reports[0],
    [activeReport]
  )

  function setRange(from: string, to: string) {
    setDateFrom(from)
    setDateTo(to)
  }

  function exportReport() {
    const csv = toCsv([
      { Kennzahl: "Aktiver Bericht", Wert: activeReportDetails.title },
      { Kennzahl: "Von", Wert: formatDisplayDate(dateFrom) },
      { Kennzahl: "Bis", Wert: formatDisplayDate(dateTo) },
      { Kennzahl: "Umsatz", Wert: "124.580 EUR" },
      { Kennzahl: "Angebote", Wert: "58" },
      { Kennzahl: "Rechnungen", Wert: "156" },
      { Kennzahl: "Offene Rechnungen", Wert: "28.450 EUR" }
    ])
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `${activeReportDetails.key}-bericht-${dateFrom}-${dateTo}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className={`${styles.rlPage} ${theme === "dark" ? styles.darkReports : ""}`}>
      <div className={styles.rlHeader}>
        <div>
          <h1>Berichte</h1>
          <p>Analysen, Statistiken und Auswertungen auf einen Blick</p>
        </div>

        <div className={styles.rlActions}>
          <div className={styles.reportDatePicker}>
            <button className={styles.rlBtn} type="button" onClick={() => setCalendarOpen((open) => !open)} aria-expanded={calendarOpen}>
              <CalendarDays size={16} />
              {formatDisplayDate(dateFrom)} - {formatDisplayDate(dateTo)}
            </button>

            {calendarOpen ? (
              <div className={styles.reportCalendar} role="dialog" aria-label="Zeitraum auswaehlen">
                <div className={styles.reportCalendarHead}>
                  <strong>Zeitraum</strong>
                  <button type="button" onClick={() => setCalendarOpen(false)}>Schliessen</button>
                </div>

                <div className={styles.reportCalendarGrid}>
                  <label>
                    <span>Von</span>
                    <input type="date" value={dateFrom} max={dateTo} onChange={(event) => setDateFrom(event.target.value)} />
                  </label>
                  <label>
                    <span>Bis</span>
                    <input type="date" value={dateTo} min={dateFrom} onChange={(event) => setDateTo(event.target.value)} />
                  </label>
                </div>

                <div className={styles.reportQuickRanges}>
                  <button type="button" onClick={() => setRange("2026-06-01", "2026-06-26")}>Dieser Monat</button>
                  <button type="button" onClick={() => setRange("2026-04-01", "2026-06-26")}>Quartal</button>
                  <button type="button" onClick={() => setRange("2026-01-01", "2026-06-26")}>Jahr</button>
                </div>
              </div>
            ) : null}
          </div>

          <button className={`${styles.rlBtn} ${styles.primary}`} type="button" onClick={exportReport}>
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      <div className={styles.rlKpiGrid}>
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <button className={styles.rlKpiCard} key={item.title} type="button">
              <div className={styles.rlIcon}><Icon size={22} /></div>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <small className={item.danger ? styles.danger : styles.success}>{item.trend} vs. Vormonat</small>
            </button>
          )
        })}
      </div>

      <div className={styles.rlChartGrid}>
        <button className={`${styles.rlChartCard} ${styles.large}`} type="button">
          <h3>Umsatzentwicklung</h3>
          <div className={styles.fakeLineChart} />
        </button>

        <button className={styles.rlChartCard} type="button">
          <h3>Rechnungsstatus</h3>
          <div className={styles.fakeDonut}>158</div>
          <ul className={styles.rlLegend}>
            <li><i className={styles.green} /> Bezahlt 68%</li>
            <li><i className={styles.yellow} /> Offen 18%</li>
            <li><i className={styles.red} /> Ueberfaellig 10%</li>
            <li><i className={styles.gray} /> Storniert 4%</li>
          </ul>
        </button>

        <button className={styles.rlChartCard} type="button">
          <h3>Top Kunden</h3>
          {customers.map((customer, index) => (
            <div className={styles.rlBarRow} key={customer}>
              <span>{customer}</span>
              <div><b style={{ width: `${90 - index * 15}%` }} /></div>
            </div>
          ))}
        </button>

        <button className={styles.rlChartCard} type="button">
          <h3>Aktivitaeten</h3>
          <div className={styles.fakeBars}>
            {activityBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </button>
      </div>

      <div className={styles.rlReportCard}>
        <div className={styles.reportSectionHead}>
          <div>
            <h3>Verfuegbare Berichte</h3>
            <p>{activeReportDetails.title} ist aktiv fuer {formatDisplayDate(dateFrom)} - {formatDisplayDate(dateTo)}</p>
          </div>
          <span><Check size={15} /> Alle aktiviert</span>
        </div>

        <div className={styles.rlReportGrid}>
          {reports.map((report) => (
            <button
              className={`${styles.rlReportItem} ${activeReport === report.key ? styles.activeReportItem : ""}`}
              key={report.key}
              onClick={() => setActiveReport(report.key)}
              type="button"
            >
              <span className={styles.rlIcon}><BarChart3 size={20} /></span>
              <div>
                <strong>{report.title}</strong>
                <small>{report.description}</small>
              </div>
              <b aria-hidden="true">{activeReport === report.key ? "Aktiv" : "›"}</b>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
