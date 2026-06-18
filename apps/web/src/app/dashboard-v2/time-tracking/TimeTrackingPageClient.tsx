"use client"

import type { FormEvent } from "react"
import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Check, Clock3, Euro, FileText, Loader2, Save, TimerReset } from "lucide-react"
import styles from "./TimeTrackingPage.module.css"

type ThemeMode = "dark" | "light"
type CustomerOption = { id: string; number: string; name: string }
type ProjectOption = { id: string; code: string; name: string; customerId: string | null; customerName: string }
type ArticleOption = { id: string; code: string; name: string; unit: string; price: number }
type TimeEntryRow = {
  id: string
  customerId: string | null
  projectId: string | null
  articleId: string | null
  customer: string
  project: string
  article: string
  duration: number
  rate: number
  amount: number
  billingStatus: string
  status: string
  invoiceable: boolean
  date: string
}
type Summary = { today: number; week: number; month: number; unbilled: number; unbilledAmount: number }

const emptySummary: Summary = { today: 0, week: 0, month: 0, unbilled: 0, unbilledAmount: 0 }

function todayValue() {
  return new Date().toISOString().slice(0, 10)
}

function timeValue(hours: number, minutes: number) {
  return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0")
}

function hoursBetween(start: string, end: string) {
  const [startHour, startMinute] = start.split(":").map(Number)
  const [endHour, endMinute] = end.split(":").map(Number)
  const startTotal = startHour * 60 + startMinute
  const endTotal = endHour * 60 + endMinute
  const diff = endTotal - startTotal
  return diff > 0 ? Math.round((diff / 60) * 100) / 100 : 0
}

function formatHours(value: number) {
  return new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value) + " h"
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(value)
}

export function TimeTrackingPageClient({ initialTheme }: { initialTheme: ThemeMode }) {
  const [customers, setCustomers] = useState<CustomerOption[]>([])
  const [projects, setProjects] = useState<ProjectOption[]>([])
  const [articles, setArticles] = useState<ArticleOption[]>([])
  const [entries, setEntries] = useState<TimeEntryRow[]>([])
  const [summary, setSummary] = useState<Summary>(emptySummary)
  const [customerId, setCustomerId] = useState("")
  const [projectId, setProjectId] = useState("")
  const [articleId, setArticleId] = useState("")
  const [date, setDate] = useState(todayValue)
  const [startTime, setStartTime] = useState(timeValue(9, 0))
  const [endTime, setEndTime] = useState(timeValue(10, 0))
  const [duration, setDuration] = useState("1,00")
  const [note, setNote] = useState("")
  const [billable, setBillable] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false)
  const [selectedEntryIds, setSelectedEntryIds] = useState<string[]>([])
  const [message, setMessage] = useState("")

  const filteredProjects = useMemo(() => (
    customerId ? projects.filter((project) => project.customerId === customerId) : projects
  ), [customerId, projects])

  const selectedArticle = articles.find((article) => article.id === articleId)
  const calculatedAmount = (Number(duration.replace(",", ".")) || 0) * (billable ? Number(selectedArticle?.price ?? 0) : 0)
  const invoiceableEntries = entries.filter((entry) => entry.invoiceable)
  const selectedEntries = entries.filter((entry) => selectedEntryIds.includes(entry.id))
  const selectedInvoiceableCount = selectedEntries.filter((entry) => entry.invoiceable).length

  async function refreshEntriesAndSummary() {
    const [entryResponse, summaryResponse] = await Promise.all([
      fetch("/api/time-tracking/list", { credentials: "same-origin" }),
      fetch("/api/time-tracking/summary", { credentials: "same-origin" })
    ])
    const [entryPayload, summaryPayload] = await Promise.all([
      entryResponse.ok ? entryResponse.json() : Promise.resolve({ entries: [] }),
      summaryResponse.ok ? summaryResponse.json() : Promise.resolve(emptySummary)
    ])
    const nextEntries = Array.isArray(entryPayload.entries) ? entryPayload.entries : []
    setEntries(nextEntries)
    setSelectedEntryIds((current) => current.filter((id) => nextEntries.some((entry: TimeEntryRow) => entry.id === id && entry.invoiceable)))
    setSummary({
      today: Number(summaryPayload.today ?? 0),
      week: Number(summaryPayload.week ?? 0),
      month: Number(summaryPayload.month ?? 0),
      unbilled: Number(summaryPayload.unbilled ?? 0),
      unbilledAmount: Number(summaryPayload.unbilledAmount ?? 0)
    })
  }

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      setIsLoading(true)
      try {
        const optionResponse = await fetch("/api/time-tracking/options", { credentials: "same-origin" })
        const optionPayload = optionResponse.ok ? await optionResponse.json() : { customers: [], projects: [], articles: [] }
        if (cancelled) return
        const nextCustomers = Array.isArray(optionPayload.customers) ? optionPayload.customers : []
        const nextProjects = Array.isArray(optionPayload.projects) ? optionPayload.projects : []
        const nextArticles = Array.isArray(optionPayload.articles) ? optionPayload.articles : []
        setCustomers(nextCustomers)
        setProjects(nextProjects)
        setArticles(nextArticles)
        setCustomerId(nextCustomers[0]?.id ?? "")
        setProjectId(nextProjects.find((project: ProjectOption) => project.customerId === nextCustomers[0]?.id)?.id ?? nextProjects[0]?.id ?? "")
        setArticleId(nextArticles[0]?.id ?? "")
        await refreshEntriesAndSummary()
      } catch {
        if (!cancelled) setMessage("Zeiterfassung konnte nicht vollstaendig geladen werden.")
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    void loadData()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    const nextDuration = hoursBetween(startTime, endTime)
    setDuration(nextDuration ? new Intl.NumberFormat("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(nextDuration) : "0,00")
  }, [startTime, endTime])

  useEffect(() => {
    if (!filteredProjects.some((project) => project.id === projectId)) {
      setProjectId(filteredProjects[0]?.id ?? "")
    }
  }, [filteredProjects, projectId])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSaving(true)
    setMessage("")

    try {
      const response = await fetch("/api/time-tracking/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ customerId, projectId, articleId, date, startTime, endTime, duration, note, billable })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Zeit konnte nicht gespeichert werden.")
      setMessage("Zeit gespeichert. Status: Nicht fakturiert.")
      setNote("")
      await refreshEntriesAndSummary()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Zeit konnte nicht gespeichert werden.")
    } finally {
      setIsSaving(false)
    }
  }

  function toggleEntry(entry: TimeEntryRow) {
    if (!entry.invoiceable || isCreatingInvoice) return
    setSelectedEntryIds((current) => current.includes(entry.id)
      ? current.filter((id) => id !== entry.id)
      : [...current, entry.id])
  }

  function toggleAllInvoiceable() {
    if (isCreatingInvoice) return
    const allIds = invoiceableEntries.map((entry) => entry.id)
    setSelectedEntryIds(selectedInvoiceableCount === allIds.length ? [] : allIds)
  }

  async function handleCreateInvoiceFromTimes() {
    if (!selectedEntryIds.length) return
    setIsCreatingInvoice(true)
    setMessage("")

    try {
      const response = await fetch("/api/time-tracking/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ timeEntryIds: selectedEntryIds })
      })
      const result = await response.json()
      if (!response.ok || !result?.ok) throw new Error(result?.error || "Rechnung konnte nicht erstellt werden.")
      setMessage("Rechnung erstellt. Zeiten wurden als fakturiert markiert.")
      setSelectedEntryIds([])
      await refreshEntriesAndSummary()
      if (result.href) window.location.href = result.href
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Rechnung konnte nicht erstellt werden.")
    } finally {
      setIsCreatingInvoice(false)
    }
  }

  return (
    <main className={styles.page} data-theme={initialTheme}>
      <div className={styles.header}>
        <div>
          <Link className={styles.backLink} href={"/dashboard-v2?theme=" + initialTheme}><ArrowLeft size={16} />Dashboard</Link>
          <h1>Zeiterfassung</h1>
          <p>Kunde, Projekt und Artikel auswaehlen, Zeit erfassen und als nicht fakturiert speichern.</p>
        </div>
        <div className={styles.headerBadge}><Clock3 size={18} /> Live-Erfassung</div>
      </div>

      <section className={styles.summaryGrid}>
        <div><CalendarDays size={18} /><span>Heute</span><strong>{formatHours(summary.today)}</strong></div>
        <div><Clock3 size={18} /><span>Diese Woche</span><strong>{formatHours(summary.week)}</strong></div>
        <div><TimerReset size={18} /><span>Dieser Monat</span><strong>{formatHours(summary.month)}</strong></div>
        <div><Euro size={18} /><span>Nicht abgerechnet</span><strong>{summary.unbilled} / {formatEuro(summary.unbilledAmount)}</strong></div>
      </section>

      <section className={styles.workGrid}>
        <form className={styles.formPanel} onSubmit={handleSubmit}>
          <div className={styles.panelHead}>
            <h2>Zeit erfassen</h2>
            <span>{isLoading ? "Daten werden geladen" : "Status nach Speichern: Nicht fakturiert"}</span>
          </div>

          <div className={styles.formGrid}>
            <label>Kunde<select value={customerId} onChange={(event) => setCustomerId(event.target.value)} required>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.name}</option>)}</select></label>
            <label>Projekt<select value={projectId} onChange={(event) => setProjectId(event.target.value)} required>{filteredProjects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>
            <label>Artikel<select value={articleId} onChange={(event) => setArticleId(event.target.value)} required>{articles.map((article) => <option key={article.id} value={article.id}>{article.name} · {formatEuro(article.price)}</option>)}</select></label>
            <label>Datum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <label>Startzeit<input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} required /></label>
            <label>Endzeit<input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} required /></label>
            <label>Dauer<input value={duration} onChange={(event) => setDuration(event.target.value)} inputMode="decimal" required /></label>
            <label className={styles.billableToggle}><span>Abrechenbar</span><input type="checkbox" checked={billable} onChange={(event) => setBillable(event.target.checked)} /><em>{billable ? "Ja" : "Nein"}</em></label>
            <label className={styles.full}>Notiz<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={4} placeholder="Taetigkeit oder Kontext" /></label>
          </div>

          <div className={styles.formFooter}>
            <div><span>Voraussichtlicher Betrag</span><strong>{formatEuro(calculatedAmount)}</strong></div>
            <button type="submit" disabled={isSaving || isLoading || !customerId || !projectId || !articleId}>{isSaving ? <Loader2 className={styles.spin} size={18} /> : <Save size={18} />}Speichern</button>
          </div>
          {message ? <p className={styles.message}>{message}</p> : null}
        </form>

        <article className={styles.listPanel}>
          <div className={styles.panelHead}>
            <div>
              <h2>Erfasste Zeiten</h2>
              <span>{entries.length} Eintraege</span>
            </div>
            <button
              className={styles.invoiceButton}
              type="button"
              onClick={handleCreateInvoiceFromTimes}
              disabled={isCreatingInvoice || selectedInvoiceableCount === 0}
            >
              {isCreatingInvoice ? <Loader2 className={styles.spin} size={17} /> : <FileText size={17} />}
              Rechnung aus Zeiten erstellen
            </button>
          </div>
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th className={styles.selectColumn}>
                    <input
                      type="checkbox"
                      aria-label="Alle nicht fakturierten Zeiten auswaehlen"
                      checked={invoiceableEntries.length > 0 && selectedInvoiceableCount === invoiceableEntries.length}
                      disabled={!invoiceableEntries.length || isCreatingInvoice}
                      onChange={toggleAllInvoiceable}
                    />
                  </th>
                  <th>Kunde</th>
                  <th>Projekt</th>
                  <th>Artikel</th>
                  <th>Stunden</th>
                  <th>Betrag</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {entries.length ? entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className={styles.selectColumn}>
                      <input
                        type="checkbox"
                        aria-label={entry.project + " auswaehlen"}
                        checked={selectedEntryIds.includes(entry.id)}
                        disabled={!entry.invoiceable || isCreatingInvoice}
                        onChange={() => toggleEntry(entry)}
                      />
                    </td>
                    <td>{entry.customer}</td>
                    <td><strong>{entry.project}</strong><small>{entry.date}</small></td>
                    <td>{entry.article}</td>
                    <td>{formatHours(entry.duration)}</td>
                    <td>{formatEuro(entry.amount)}</td>
                    <td><span className={styles.status}><Check size={13} />{entry.status}</span></td>
                  </tr>
                )) : <tr><td colSpan={7} className={styles.emptyCell}>{isLoading ? "Zeiten werden geladen." : "Noch keine Zeiten erfasst."}</td></tr>}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </main>
  )
}
