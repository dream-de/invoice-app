"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react"
import {
  Archive,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  Eye,
  FileImage,
  FilePlus2,
  FileText,
  Filter,
  FolderPlus,
  History,
  ImageIcon,
  Layers3,
  Link2,
  MoreHorizontal,
  Search,
  Share2,
  Sparkles,
  Tags,
  Upload
} from "lucide-react"
import styles from "./DocumentManagement.module.css"

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
  updatedAt?: string
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

const tabs = [
  ["all", "Alle Dokumente"],
  ["invoice", "Rechnungen"],
  ["offer", "Angebote"],
  ["project_file", "Projekte"],
  ["customer", "Kunden"],
  ["contract", "Vertraege"],
  ["template", "Vorlagen"],
  ["archive", "Archiv"]
]

const statusLabels: Record<string, string> = {
  open: "Offen",
  prepared: "Vorbereitet",
  active: "Aktiv",
  processed: "Verarbeitet",
  archived: "Archiviert"
}

const ocrSteps = [
  { label: "Vorbereitet", value: "prepared" },
  { label: "Aktiv", value: "active" },
  { label: "Verarbeitet", value: "processed" }
]

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value))
}

function documentTypeLabel(type: string) {
  return typeOptions.find(([value]) => value === type)?.[1] || type
}

function isImage(document?: DmsDocument) {
  return Boolean(document?.mimeType?.startsWith("image/"))
}

function isPdf(document?: DmsDocument) {
  return document?.mimeType === "application/pdf"
}

export function DocumentManagementClient() {
  const [documents, setDocuments] = useState<DmsDocument[]>([])
  const [options, setOptions] = useState<Options>({ customers: [], projects: [], invoices: [], offers: [] })
  const [cards, setCards] = useState({ total: 0, recentUploads: 0, open: 0 })
  const [notice, setNotice] = useState("")
  const [busy, setBusy] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedId, setSelectedId] = useState("")
  const [multiSelect, setMultiSelect] = useState(false)
  const [filters, setFilters] = useState({ q: "", type: "", customer: "", project: "", date: "" })
  const [draft, setDraft] = useState({ name: "", documentType: "attachment", status: "open", version: "1", customerId: "", projectId: "", invoiceId: "", offerInvoiceId: "" })
  const [file, setFile] = useState<File | null>(null)

  const tabType = activeTab === "all" || activeTab === "customer" || activeTab === "template" || activeTab === "archive" ? "" : activeTab
  const effectiveFilters = useMemo(() => ({ ...filters, type: filters.type || tabType }), [filters, tabType])
  const query = useMemo(() => new URLSearchParams(Object.entries(effectiveFilters).filter(([, value]) => value)), [effectiveFilters])

  async function loadDocuments() {
    const response = await fetch(`/api/document-management/list?${query.toString()}`, { cache: "no-store" })
    const result = await response.json().catch(() => null)
    if (!response.ok || !result?.ok) {
      setNotice(result?.error || "Dokumente konnten nicht geladen werden.")
      return
    }
    setDocuments(result.documents || [])
    setCards(result.cards || { total: 0, recentUploads: 0, open: 0 })
    setSelectedId((current) => current || result.documents?.[0]?.id || "")
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

  const selectedDocument = documents.find((document) => document.id === selectedId) || documents[0]
  const totalBytes = documents.reduce((sum, document) => sum + document.size, 0)
  const storageLimit = 10 * 1024 * 1024 * 1024
  const storagePercent = Math.min(100, Math.round((totalBytes / storageLimit) * 100))
  const imageCount = documents.filter((document) => document.mimeType.startsWith("image/")).length
  const pdfCount = documents.filter((document) => document.mimeType === "application/pdf").length
  const ocrProcessed = documents.filter((document) => ["processed", "verarbeitet"].includes(document.status)).length
  const openAssignments = documents.filter((document) => !document.customer && !document.project && !document.invoice).length

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
          <div>
            <span className={styles.eyebrow}>Premium Dokumentencenter</span>
            <h1>Dokumentenmanagement</h1>
            <p>Arbeitszentrale fuer Uploads, Vorschau, Zuordnung, Versionen, OCR-Vorbereitung und Archivierung.</p>
          </div>
          <div className={styles.headerActions}>
            <Link className={styles.secondaryButton} href="/dashboard-v2"><Archive size={16} />Dashboard</Link>
            <label className={styles.primaryButton}>
              <Upload size={16} />
              Hochladen
              <input className={styles.hiddenInput} data-dms-file type="file" accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" onChange={(event: ChangeEvent<HTMLInputElement>) => setFile(event.target.files?.[0] ?? null)} />
            </label>
          </div>
        </header>

        <section className={styles.kpis}>
          <article><span>Dokumente gesamt</span><strong>{cards.total}</strong><p>Alle Dateien im DMS</p></article>
          <article><span>Uploads heute</span><strong>{cards.recentUploads}</strong><p>Aktuelle Upload-Aktivitaet</p></article>
          <article><span>Speicherplatz</span><strong>{formatSize(totalBytes)}</strong><p>{storagePercent}% von 10 GB genutzt</p></article>
          <article><span>OCR-Verarbeitet</span><strong>{ocrProcessed}</strong><p>Vorbereitete Verarbeitung</p></article>
          <article><span>Offene Zuordnungen</span><strong>{openAssignments || cards.open}</strong><p>Kunde, Projekt oder Beleg fehlt</p></article>
        </section>

        <section className={styles.tabs} aria-label="Dokumentbereiche">
          {tabs.map(([value, label]) => (
            <button className={activeTab === value ? styles.activeTab : ""} key={value} type="button" onClick={() => setActiveTab(value)}>
              {label}
            </button>
          ))}
        </section>

        <section className={styles.toolbar}>
          <button className={styles.primaryButton} type="button" onClick={() => document.querySelector<HTMLInputElement>("[data-dms-file]")?.click()}><Upload size={16} />Dokument hochladen</button>
          <button className={styles.toolButton} type="button"><FolderPlus size={16} />Ordner erstellen</button>
          <button className={multiSelect ? styles.activeToolButton : styles.toolButton} type="button" onClick={() => setMultiSelect((current) => !current)}><Layers3 size={16} />Mehrfachauswahl</button>
          <div className={styles.searchBox}><Search size={16} /><input aria-label="Dokumente suchen" value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Suche nach Name, Kunde, Projekt" /></div>
          <select aria-label="Filter" value={filters.type} onChange={(event) => updateFilter("type", event.target.value)}>
            <option value="">Filter</option>
            {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select aria-label="Sortierung" defaultValue="date-desc">
            <option value="date-desc">Neueste zuerst</option>
            <option value="name-asc">Name A-Z</option>
            <option value="size-desc">Groesste Dateien</option>
          </select>
          <button className={styles.iconButton} type="button" aria-label="Filter anzeigen"><Filter size={17} /></button>
        </section>

        {notice ? <p className={styles.notice}>{notice}</p> : null}

        <section className={styles.workspace}>
          <div className={styles.mainColumn}>
            <form className={styles.uploadPanel} onSubmit={handleUpload}>
              <div>
                <h2>Dokument erfassen</h2>
                <p>{file ? file.name : "Datei auswaehlen und direkt mit Kunden, Projekten oder Belegen verbinden."}</p>
              </div>
              <div className={styles.uploadGrid}>
                <label>Name<input value={draft.name} onChange={(event) => updateDraft("name", event.target.value)} placeholder="Dokumentname" /></label>
                <label>Typ<select value={draft.documentType} onChange={(event) => updateDraft("documentType", event.target.value)}>{typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
                <label>Kunde<select value={draft.customerId} onChange={(event) => updateDraft("customerId", event.target.value)}><option value="">Ohne Kunde</option>{options.customers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Projekt<select value={draft.projectId} onChange={(event) => updateDraft("projectId", event.target.value)}><option value="">Ohne Projekt</option>{options.projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                <label>Rechnung<select value={draft.invoiceId} onChange={(event) => updateDraft("invoiceId", event.target.value)}><option value="">Ohne Rechnung</option>{options.invoices.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select></label>
                <label>Angebot<select value={draft.offerInvoiceId} onChange={(event) => updateDraft("offerInvoiceId", event.target.value)}><option value="">Ohne Angebot</option>{options.offers.map((item) => <option key={item.id} value={item.id}>{item.number}</option>)}</select></label>
                <label>Status<select value={draft.status} onChange={(event) => updateDraft("status", event.target.value)}><option value="open">Offen</option><option value="prepared">Vorbereitet</option><option value="active">Aktiv</option><option value="processed">Verarbeitet</option></select></label>
                <label>Version<input value={draft.version} inputMode="numeric" onChange={(event) => updateDraft("version", event.target.value)} /></label>
              </div>
              <button className={styles.primaryButton} type="submit" disabled={busy || !file}><FilePlus2 size={16} />{busy ? "Upload laeuft..." : "Upload speichern"}</button>
            </form>

            <div className={styles.tableWrap}>
              <div className={styles.tableHeader}>
                <h2>Dokumentliste</h2>
                <span>{documents.length} Treffer</span>
              </div>
              <div className={styles.table} role="table">
                <div className={styles.tableHead} role="row">
                  <span>Name</span><span>Typ</span><span>Kunde</span><span>Projekt</span><span>Datum</span><span>Groesse</span><span>Status</span><span>Aktionen</span>
                </div>
                {documents.map((document) => (
                  <button className={selectedDocument?.id === document.id ? styles.selectedRow : styles.tableRow} key={document.id} type="button" onClick={() => setSelectedId(document.id)}>
                    <span className={styles.nameCell}>{multiSelect ? <input type="checkbox" aria-label={`${document.name} auswaehlen`} onClick={(event) => event.stopPropagation()} /> : document.mimeType.startsWith("image/") ? <FileImage size={18} /> : <FileText size={18} />}<strong>{document.name}</strong><small>{document.originalName}</small></span>
                    <span>{documentTypeLabel(document.documentType)}</span>
                    <span>{document.customer?.name || "-"}</span>
                    <span>{document.project?.name || "-"}</span>
                    <span>{formatDate(document.createdAt)}</span>
                    <span>{formatSize(document.size)}</span>
                    <span><em>{statusLabels[document.status] || document.status}</em></span>
                    <span className={styles.rowActions}>
                      <a href={document.downloadUrl} aria-label="Vorschau oeffnen" onClick={(event) => event.stopPropagation()}><Eye size={16} /></a>
                      <a href={`${document.downloadUrl}?download=1`} aria-label="Download" onClick={(event) => event.stopPropagation()}><Download size={16} /></a>
                      <MoreHorizontal size={16} />
                    </span>
                  </button>
                ))}
                {!documents.length ? <div className={styles.emptyState}><Search size={18} />Keine Dokumente gefunden.</div> : null}
              </div>
            </div>
          </div>

          <aside className={styles.previewPanel}>
            <div className={styles.previewHead}>
              <div>
                <span>Dokumentvorschau</span>
                <h2>{selectedDocument?.name || "Kein Dokument ausgewaehlt"}</h2>
              </div>
              {selectedDocument ? <a className={styles.iconButton} href={selectedDocument.downloadUrl} aria-label="Vorschau oeffnen"><Eye size={17} /></a> : null}
            </div>

            <div className={styles.previewBox}>
              {selectedDocument && isImage(selectedDocument) ? <img src={selectedDocument.downloadUrl} alt={selectedDocument.name} /> : null}
              {selectedDocument && isPdf(selectedDocument) ? <iframe src={selectedDocument.downloadUrl} title={selectedDocument.name} /> : null}
              {selectedDocument && !isImage(selectedDocument) && !isPdf(selectedDocument) ? <div className={styles.previewFallback}><FileText size={34} /><strong>{documentTypeLabel(selectedDocument.documentType)}</strong><span>{selectedDocument.mimeType}</span></div> : null}
              {!selectedDocument ? <div className={styles.previewFallback}><FileText size={34} /><strong>Keine Vorschau</strong><span>Waehle ein Dokument aus der Liste.</span></div> : null}
            </div>

            <div className={styles.quickActions}>
              <button type="button" onClick={() => document.querySelector<HTMLInputElement>("[data-dms-file]")?.click()}><Upload size={16} />Hochladen</button>
              <a href={selectedDocument?.downloadUrl || "#"}><Eye size={16} />Vorschau</a>
              <a href={selectedDocument ? `${selectedDocument.downloadUrl}?download=1` : "#"}><Download size={16} />Download</a>
              <button type="button"><Share2 size={16} />Teilen</button>
              <button type="button"><Archive size={16} />Archivieren</button>
            </div>

            <section className={styles.metaGrid}>
              <h3>Metadaten</h3>
              <dl>
                <div><dt>Typ</dt><dd>{selectedDocument ? documentTypeLabel(selectedDocument.documentType) : "-"}</dd></div>
                <div><dt>Datum</dt><dd>{selectedDocument ? formatDate(selectedDocument.createdAt) : "-"}</dd></div>
                <div><dt>Groesse</dt><dd>{selectedDocument ? formatSize(selectedDocument.size) : "-"}</dd></div>
                <div><dt>Status</dt><dd>{selectedDocument ? statusLabels[selectedDocument.status] || selectedDocument.status : "-"}</dd></div>
              </dl>
            </section>

            <section className={styles.tagPanel}>
              <h3><Tags size={16} />Dokument-Tags</h3>
              <div>
                {selectedDocument?.customer ? <span>Kunde: {selectedDocument.customer.name}</span> : <span>Kunde</span>}
                {selectedDocument?.project ? <span>Projekt: {selectedDocument.project.name}</span> : <span>Projekt</span>}
                {selectedDocument?.invoice ? <span>Rechnung: {selectedDocument.invoice.number}</span> : <span>Rechnung</span>}
                <span>Angebot</span><span>Vertrag</span><span>Benutzerdefiniert</span>
              </div>
            </section>

            <section className={styles.ocrPanel}>
              <h3><Sparkles size={16} />OCR Text</h3>
              <p>{selectedDocument ? `OCR ist fuer ${selectedDocument.originalName} vorbereitet. Nach Aktivierung wird der erkannte Text hier angezeigt.` : "OCR-Bereich ist vorbereitet."}</p>
              <div className={styles.ocrSteps}>
                {ocrSteps.map((step) => <span key={step.value}><CheckCircle2 size={15} />{step.label}</span>)}
              </div>
            </section>

            <section className={styles.versionPanel}>
              <h3><History size={16} />Versionsverwaltung</h3>
              <div><Clock3 size={15} /><span>Version {selectedDocument?.version || 1}</span><small>Aktuelle Datei</small></div>
              <div><Clock3 size={15} /><span>Version {(selectedDocument?.version || 1) + 1}</span><small>Naechste Aenderung vorbereitet</small></div>
            </section>

            <section className={styles.storagePanel}>
              <h3>Speicheruebersicht</h3>
              <div className={styles.meter}><span style={{ width: `${Math.max(storagePercent, documents.length ? 8 : 0)}%` }} /></div>
              <div className={styles.storageStats}>
                <span>Benutzt: {formatSize(totalBytes)}</span>
                <span>Frei: {formatSize(Math.max(0, storageLimit - totalBytes))}</span>
                <span><FileText size={14} />PDF {pdfCount}</span>
                <span><ImageIcon size={14} />Bilder {imageCount}</span>
              </div>
            </section>

            <section className={styles.linkedPanel}>
              <h3><Link2 size={16} />Zugeordnete Entitaeten</h3>
              <p>{selectedDocument?.customer?.name || "Kein Kunde"} · {selectedDocument?.project?.name || "Kein Projekt"} · {selectedDocument?.invoice?.number || "Kein Beleg"}</p>
              <button type="button"><ChevronDown size={15} />Zuordnung bearbeiten</button>
            </section>
          </aside>
        </section>
      </div>
    </main>
  )
}
