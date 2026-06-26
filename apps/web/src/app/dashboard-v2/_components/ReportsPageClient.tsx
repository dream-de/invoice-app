"use client"

import { BarChart3, CalendarDays, ClipboardList, Download, Euro, FileText, TrendingUp } from "lucide-react"
import styles from "./ReportsLogs.module.css"

const kpis = [
  { title: "Umsatz", value: "124.580 EUR", trend: "+12%", icon: Euro },
  { title: "Angebote", value: "58", trend: "+8%", icon: FileText },
  { title: "Rechnungen", value: "156", trend: "+15%", icon: ClipboardList },
  { title: "Offene Rechnungen", value: "28.450 EUR", trend: "-4%", icon: TrendingUp, danger: true }
]

const reports = ["Monatsbericht", "Jahresbericht", "Steuerbericht", "Projektbericht", "Kundenbericht", "Benutzerbericht"]
const customers = ["Acme GmbH", "Nordhandel GmbH", "Tech Solutions", "Design Studio"]
const activityBars = [45, 38, 62, 70, 43, 52, 40]

export function ReportsPageClient() {
  return (
    <div className={styles.rlPage}>
      <div className={styles.rlHeader}>
        <div>
          <h1>Berichte</h1>
          <p>Analysen, Statistiken und Auswertungen auf einen Blick</p>
        </div>

        <div className={styles.rlActions}>
          <button className={styles.rlBtn} type="button">
            <CalendarDays size={16} />
            01.06.2026 - 26.06.2026
          </button>
          <button className={`${styles.rlBtn} ${styles.primary}`} type="button">
            <Download size={16} />
            Exportieren
          </button>
        </div>
      </div>

      <div className={styles.rlKpiGrid}>
        {kpis.map((item) => {
          const Icon = item.icon
          return (
            <div className={styles.rlKpiCard} key={item.title}>
              <div className={styles.rlIcon}><Icon size={22} /></div>
              <span>{item.title}</span>
              <strong>{item.value}</strong>
              <small className={item.danger ? styles.danger : styles.success}>{item.trend} vs. Vormonat</small>
            </div>
          )
        })}
      </div>

      <div className={styles.rlChartGrid}>
        <div className={`${styles.rlChartCard} ${styles.large}`}>
          <h3>Umsatzentwicklung</h3>
          <div className={styles.fakeLineChart} />
        </div>

        <div className={styles.rlChartCard}>
          <h3>Rechnungsstatus</h3>
          <div className={styles.fakeDonut}>158</div>
          <ul className={styles.rlLegend}>
            <li><i className={styles.green} /> Bezahlt 68%</li>
            <li><i className={styles.yellow} /> Offen 18%</li>
            <li><i className={styles.red} /> Ueberfaellig 10%</li>
            <li><i className={styles.gray} /> Storniert 4%</li>
          </ul>
        </div>

        <div className={styles.rlChartCard}>
          <h3>Top Kunden</h3>
          {customers.map((customer, index) => (
            <div className={styles.rlBarRow} key={customer}>
              <span>{customer}</span>
              <div><b style={{ width: `${90 - index * 15}%` }} /></div>
            </div>
          ))}
        </div>

        <div className={styles.rlChartCard}>
          <h3>Aktivitaeten</h3>
          <div className={styles.fakeBars}>
            {activityBars.map((height, index) => (
              <span key={`${height}-${index}`} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.rlReportCard}>
        <h3>Verfuegbare Berichte</h3>
        <div className={styles.rlReportGrid}>
          {reports.map((report) => (
            <button className={styles.rlReportItem} key={report} type="button">
              <span className={styles.rlIcon}><BarChart3 size={20} /></span>
              <div>
                <strong>{report}</strong>
                <small>Analyse oeffnen</small>
              </div>
              <b aria-hidden="true">&rsaquo;</b>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
