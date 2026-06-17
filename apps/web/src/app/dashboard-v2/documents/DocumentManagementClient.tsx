"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import { Archive, Download, Search, Upload } from "lucide-react"
import styles from "../phase15-16.module.css"

type Option = { id: string; name?: string; number?: string }
type DmsDocument = {
  id: string
  name: string
  originalName: string
  documentType: string
  mimeType: string
  size: number
  status: string
  version: number
  createdAt: string
  customer?: Option | null
  project?: Option | null
  invoice?: { id: string; number: string; type?: string | null } | null
  downloadUrl: string
}
type Options = { customers: Option[]; projects: Option[]; invoices: Option[]; offers: Option[] }

const typeOptions = [
  ["invoice", "Rechnungen"],
  ["offer", "Angebote"],
  ["contract", "Vertraege"],
  ["delivery_note", "Lieferscheine"],
  ["attachment", "Anhaenge"],
  ["project_file", "Projektdateien"]
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function DocumentManagementClient() {
  const [documents, setDocuments] = useState<DmsDocument[]>([])
  const [options, setOptions] = useState<Options>({ customers: [], projects: [], invoices: [], offers: [] })
  const [cards, setCards] = useState({ total: 0, recentUploads: 0, open: 0 })
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [filters, setFilters] = useState({ q: "", type: "", customer: "", project: "", date: "" })
  const [draft, setDraft] = useState({ name: "", documentType: "attachment", status: "open", version: "1", customerId: "", projectId: "", invoiceId: "", offerInvoiceId: "" })
  const [file, setFile] = useState<File | null>(null)

  const query = useMemo(() => new URLSearchParams(Object.entries(filters).filter(([, value]) => value)), [filters])

  async function loadDocuments() {
    const response = await fetch(`/api/document-management/list?${query.toString()}`, { cache: "no-store" })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setNotice(result?.error || "Dokumente konnten nicht geladen werden.")
      return
    }
    setDocuments(result.documents || [])
    setCards(result.cards || { total: 0, recentUploads: 0, open: 0 })
  }

  useEffect(() => {
    void loadDocuments()
  }, [query])

  useEffect(() => {
    fetch("/api/document-management/options", { cache: "no-store" })
      .then((response) => response.json())
      .then((result) => {
        if (result?.ok) setOptions({ customers: result.customers || [], projects: result.projects || [], invoices: result.invoices || [], offers: result.offers || [] })
      })
      .catch(() => null)
  }, [])

  function updateDraft(key: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
  }

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  async function handleUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!file) {
      setNotice("Bitte zuerst eine Datei auswaehlen.")
      return
    }

    setBusy(true)
    setNotice("")
    const formData = new FormData()
    formData.set("file", file)
    Object.entries(draft).forEach(([key, value]) => formData.set(key, value))

    const response = await fetch("/api/document-management/upload", { method: "POST", body: formData })
    const result = await response.json().catch(() => null)
    setBusy(false)

    if (!response.ok || !result?.ok) {
      setNotice(result?.error || "Upload fehlgeschlagen.")
      return
    }

    setNotice("Dokument wurde hochgeladen und zugeordnet.")
    setDraft({ name: "", documentType: "attachment", status: "open", version: "1", customerId: "", projectId: "", invoiceId: "", offerInvoiceId: "" })
    setFile(null)
    const input = document.querySelector<HTMLInputElement>("[data-dms-file]")
    if (input) input.value = ""
    await loadDocuments()
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <div><h1>Dokumentenmanagement</h1><p>PDF, DOCX, XLSX, PNG und JPG mit Kunde, Projekt, Rechnung oder Angebot verknuepfen.</p></div>
          <Link className={styles.backLink} href="/dashboard-v2"><Archive size={16} />Dashboard</Link>
        </header>

        <section className={styles.cards}>
          <article className={styles.card}><span className={styles.badge}>Dokumente gesamt</span><h3>{cards.total}</h3><p>Alle DMS-Dateien</p></article>
          <article className={styles.card}><span className={styles.badge}>Letzte Uploads</span><h3>{cards.recentUploads}</h3><p>Aktuelle Trefferliste</p></article>
          <article className={styles.card}><span className={styles.badge}>Offene Dokumente</span><h3>{cards.open}</h3><p>Status offen</p></article>
        </section>

        <section className={styles.twoColumn}>
          <article className={styles.panel}>
            <h2>Upload</h2>
            <form className={styles.form} onSubmit={handleUpload}>
              <label>Name<input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Dokumentname" /></label>
              <label>Typ<select value={draft.documentType} onChange={(event) => updateDraft("documentType", event.target.value)}>{typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Kunde<select value={draft.customerId} onChange={(event) => updateDraft("customerId", event.target.value)}><option value="">Ohne Kunde</option>{options.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Projekt<select value={draft.projectId} onChange={(event) => updateDraft("projectId", event.target.value)}><option value="">Ohne Projekt</option>{options.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
              <label>Rechnung<select value={draft.invoiceId} onChange={(event) => updateDraft("invoiceId", event.target.value)}><option value="">Ohne Rechnung</option>{options.invoices.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select></label>
              <label>Angebot<select value={draft.offerInvoiceId} onChange={(event) => updateDraft("offerInvoiceId", event.target.value)}><option value="">Ohne Angebot</option>{options.offers.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select></label>
              <label>Version<input value={draft.version} inputMode="numeric" onChange={(event) => updateDraft("version", event.target.value)} /></label>
              <label>Datei<input data-dms-file type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} /></label>
              <button className={styles.button} type="submit" disabled={busy}><Upload size={16} />{busy ? "Upload laeuft..." : "Hochladen"}</button>
            </form>
          </article>

          <article className={styles.panel}>
            <h2>Suche</h2>
            <div className={styles.toolbar}>
              <input aria-label="Name suchen" value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Name, Kunde, Projekt" />
              <select aria-label="Typ filtern" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}><option value="">Alle Typen</option>{typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
              <input aria-label="Kunde filtern" value={filters.customer} onChange={(event) => updateFilter("customer", event.target.value)} placeholder="Kunde" />
              <input aria-label="Datum filtern" type="date" value={filters.date} onChange={(event) => updateFilter("date", event.target.value)} />
            </div>
            {notice ? <p className={styles.notice}>{notice}</p> : null}
            <div className={styles.list}>
              {documents.map((document) => (
                <div className={styles.row} key={document.id}>
                  <strong>{document.name}</strong>
                  <span>{typeOptions.find(([value]) => value === document.documentType)?.[1] || document.documentType}</span>
                  <span>{document.customer?.name || document.project?.name || "-"}</span>
                  <span>Version {document.version} · {formatSize(document.size)}</span>
                  <a className={styles.secondaryButton} href={`${document.downloadUrl}?download=1`}><Download size={16} />Download</a>
                </div>
              ))}
              {!documents.length ? <p className={styles.notice}><Search size={16} /> Keine Dokumente gefunden.</p> : null}
            </div>
          </article>
        </section>
      </div>
    </main>
  )
}
