"use client"

import Link from "next/link"
import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from "react"
import {
  ArrowLeft,
  Download,
  Edit3,
  Eye,
  FileImage,
  FileText,
  Mail,
  Maximize2,
  Printer,
  ScanLine,
  Search,
  Share2,
  Square,
  Trash2,
  X
} from "lucide-react"
import { ShareReleaseDialog } from "../../../components/share/ShareReleaseDialog"
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
  createdBy?: string | { name?: string; email?: string } | null
  downloadUrl: string
}

const typeOptions = [
  ["invoice", "Rechnungen"],
  ["offer", "Angebote"],
  ["contract", "Vertraege"],
  ["delivery_note", "Lieferscheine"],
  ["attachment", "Anhaenge"],
  ["project_file", "Projektdateien"],
  ["template", "Vorlagen"]
]

const tabs = [
  ["all", "Alle"],
  ["invoice", "Rechnungen"],
  ["offer", "Angebote"],
  ["project_file", "Projekte"],
  ["customer", "Kunden"],
  ["contract", "Vertraege"],
  ["template", "Vorlagen"],
  ["archive", "Archiv"],
  ["new_folder", "Neu Ordner"]
]

const statusLabels: Record<string, string> = {
  open: "Offen",
  prepared: "Vorbereitet",
  active: "Aktiv",
  processed: "Verarbeitet",
  archived: "Archiviert",
  paid: "Bezahlt",
  accepted: "Angenommen",
  sent: "Versendet",
  draft: "Entwurf",
  overdue: "Ueberfaellig"
}

const sampleDocuments: DmsDocument[] = [
  {
    id: "sample-re-2026-001",
    name: "RE-2026-001.pdf",
    originalName: "RE-2026-001.pdf",
    documentType: "invoice",
    mimeType: "application/pdf",
    size: 256 * 1024,
    status: "paid",
    version: 1,
    createdAt: "2026-05-24T10:45:00.000Z",
    customer: { id: "sample-customer-1", name: "Muster GmbH" },
    project: { id: "sample-project-1", name: "Website Relaunch" },
    invoice: { id: "sample-invoice-1", number: "RE-2026-001" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-re-2026-002",
    name: "RE-2026-002.xlsx",
    originalName: "RE-2026-002.xlsx",
    documentType: "invoice",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 98 * 1024,
    status: "open",
    version: 1,
    createdAt: "2026-05-23T16:32:00.000Z",
    customer: { id: "sample-customer-2", name: "Beispiel AG" },
    project: { id: "sample-project-2", name: "SEO Optimierung" },
    invoice: { id: "sample-invoice-2", number: "RE-2026-002" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-an-2026-001",
    name: "AN-2026-001.pdf",
    originalName: "AN-2026-001.pdf",
    documentType: "offer",
    mimeType: "application/pdf",
    size: 187 * 1024,
    status: "accepted",
    version: 1,
    createdAt: "2026-05-22T14:22:00.000Z",
    customer: { id: "sample-customer-3", name: "Kreativwerkstatt" },
    project: { id: "sample-project-3", name: "Logo Design" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-contract",
    name: "Vertrag_MusterGmbH.docx",
    originalName: "Vertrag_MusterGmbH.docx",
    documentType: "contract",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    size: 120 * 1024,
    status: "active",
    version: 1,
    createdAt: "2026-05-20T09:15:00.000Z",
    customer: { id: "sample-customer-1", name: "Muster GmbH" },
    project: { id: "sample-project-4", name: "Wartungsvertrag" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-delivery",
    name: "Lieferschein_2026-001.pdf",
    originalName: "Lieferschein_2026-001.pdf",
    documentType: "delivery_note",
    mimeType: "application/pdf",
    size: 142 * 1024,
    status: "sent",
    version: 1,
    createdAt: "2026-05-19T13:05:00.000Z",
    customer: { id: "sample-customer-2", name: "Beispiel AG" },
    project: { id: "sample-project-5", name: "Webentwicklung" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-presentation",
    name: "Praesentation_Projekt.pptx",
    originalName: "Praesentation_Projekt.pptx",
    documentType: "attachment",
    mimeType: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    size: 3.2 * 1024 * 1024,
    status: "draft",
    version: 1,
    createdAt: "2026-05-18T11:11:00.000Z",
    customer: { id: "sample-customer-3", name: "Kreativwerkstatt" },
    project: { id: "sample-project-6", name: "Pitch Deck" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-re-2026-003",
    name: "RE-2026-003.pdf",
    originalName: "RE-2026-003.pdf",
    documentType: "invoice",
    mimeType: "application/pdf",
    size: 221 * 1024,
    status: "overdue",
    version: 1,
    createdAt: "2026-05-17T08:43:00.000Z",
    customer: { id: "sample-customer-4", name: "Technik GmbH" },
    project: { id: "sample-project-7", name: "Wartung & Support" },
    invoice: { id: "sample-invoice-3", number: "RE-2026-003" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  },
  {
    id: "sample-costs",
    name: "Kostenaufstellung.xlsx",
    originalName: "Kostenaufstellung.xlsx",
    documentType: "attachment",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: 75 * 1024,
    status: "draft",
    version: 1,
    createdAt: "2026-05-16T15:30:00.000Z",
    customer: { id: "sample-customer-4", name: "Technik GmbH" },
    project: { id: "sample-project-7", name: "Wartung & Support" },
    createdBy: "Max Mustermann",
    downloadUrl: "#"
  }
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

type EditDraft = {
  id: string
  name: string
  customer: string
  project: string
  documentType: string
  status: string
  date: string
}

export function DocumentManagementClient() {
  const [documents, setDocuments] = useState<DmsDocument[]>([])
  const [notice, setNotice] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [selectedId, setSelectedId] = useState("")
  const [multiSelect, setMultiSelect] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [deletedIds, setDeletedIds] = useState<string[]>([])
  const [documentEdits, setDocumentEdits] = useState<Record<string, Partial<DmsDocument>>>({})
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null)
  const [editOffset, setEditOffset] = useState({ x: 0, y: 0 })
  const [editDragStart, setEditDragStart] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const [folderDraft, setFolderDraft] = useState("")
  const [folders, setFolders] = useState<string[]>([])
  const [shareDocumentId, setShareDocumentId] = useState("")
  const [previewZoom, setPreviewZoom] = useState(94)
  const [previewOffset, setPreviewOffset] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)
  const [previewStatus, setPreviewStatus] = useState("")
  const [filters, setFilters] = useState({ q: "", type: "", customer: "", project: "", date: "" })

  const tabType = activeTab === "all" || activeTab === "customer" || activeTab === "archive" || activeTab === "new_folder" ? "" : activeTab
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
  }

  useEffect(() => {
    void loadDocuments()
  }, [query])

  const visibleDocuments = useMemo(() => {
    const baseDocuments = (documents.length ? documents : sampleDocuments).map((document) => ({ ...document, ...documentEdits[document.id] }))
    const query = filters.q.trim().toLowerCase()
    const type = filters.type || tabType
    return baseDocuments.filter((document) => {
      if (deletedIds.includes(document.id)) return false
      if (activeTab === "customer" && !document.customer?.name) return false
      if (activeTab === "archive" && document.status !== "archived") return false
      if (type && document.documentType !== type) return false
      if (!query) return true
      return [document.name, document.customer?.name, document.project?.name, documentTypeLabel(document.documentType), statusLabels[document.status] || document.status].filter(Boolean).join(" ").toLowerCase().includes(query)
    })
  }, [activeTab, deletedIds, documentEdits, documents, filters.q, filters.type, tabType])

  const selectedDocument = visibleDocuments.find((document) => document.id === selectedId)
  const documentForShare = visibleDocuments.find((document) => document.id === shareDocumentId)
  const allVisibleSelected = visibleDocuments.length > 0 && visibleDocuments.every((document) => selectedIds.includes(document.id))

  function updateFilter(key: keyof typeof filters, value: string) {
    setFilters((current) => ({ ...current, [key]: value }))
  }

  function selectDocument(document: DmsDocument) {
    if (multiSelect) {
      setSelectedIds((current) => {
        const next = current.includes(document.id) ? current.filter((id) => id !== document.id) : [...current, document.id]
        if (!next.length) setMultiSelect(false)
        return next
      })
      return
    }
    setSelectedId(document.id)
  }

  function toggleAllSelection() {
    setActiveTab("all")
    setSelectedId("")
    setSelectedIds((current) => {
      const visibleIds = visibleDocuments.map((document) => document.id)
      const allSelected = visibleIds.length > 0 && visibleIds.every((id) => current.includes(id))
      if (allSelected) {
        setMultiSelect(false)
        return []
      }
      setMultiSelect(true)
      return Array.from(new Set([...current, ...visibleIds]))
    })
  }

  function closePreview() {
    setSelectedId("")
    setPreviewStatus("")
    setPreviewZoom(94)
    setPreviewOffset({ x: 0, y: 0 })
    setDragStart(null)
  }

  function documentUrl(documentItem: DmsDocument) {
    if (documentItem.downloadUrl === "#") return window.location.href
    return documentItem.downloadUrl
  }

  function selectedDocumentUrl() {
    if (!selectedDocument) return window.location.href
    return documentUrl(selectedDocument)
  }

  function downloadDocument(documentItem: DmsDocument) {
    const link = document.createElement("a")
    link.href = documentItem.downloadUrl === "#" ? window.location.href : `${documentItem.downloadUrl}?download=1`
    link.download = documentItem.name
    document.body.appendChild(link)
    link.click()
    link.remove()
  }

  function downloadPreview() {
    if (!selectedDocument) return
    downloadDocument(selectedDocument)
    setPreviewStatus("Download gestartet.")
  }

  function printPreview() {
    setPreviewStatus("Druckdialog geoeffnet.")
    window.print()
  }

  async function copyShareLink(value: string) {
    try {
      await navigator.clipboard?.writeText(value)
      return "Link kopiert."
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
      return "Link kopiert."
    }
  }

  function openShareDialog(documentItem: DmsDocument) {
    setShareDocumentId(documentItem.id)
    setNotice("")
  }

  async function sharePreview() {
    if (!selectedDocument) return
    try {
      setShareDocumentId(selectedDocument.id)
      setPreviewStatus("Freigabe geoeffnet.")
    } catch {
      setPreviewStatus("Teilen abgebrochen.")
    }
  }

  function emailPreview() {
    if (!selectedDocument) return
    const subject = encodeURIComponent(`Dokument ${selectedDocument.name}`)
    const body = encodeURIComponent(`Hallo,\n\nhier ist das Dokument: ${selectedDocument.name}\n${selectedDocumentUrl()}\n`)
    window.location.href = `mailto:?subject=${subject}&body=${body}`
    setPreviewStatus("E-Mail vorbereitet.")
  }

  function scanPreview() {
    setPreviewStatus("Scan/OCR vorbereitet.")
  }

  function editDocument(documentItem: DmsDocument) {
    setEditDraft({
      id: documentItem.id,
      name: documentItem.name,
      customer: documentItem.customer?.name || "",
      project: documentItem.project?.name || "",
      documentType: documentItem.documentType,
      status: documentItem.status,
      date: documentItem.createdAt.slice(0, 10)
    })
    setEditOffset({ x: 0, y: 0 })
    setNotice("")
  }

  function updateEditDraft(key: keyof EditDraft, value: string) {
    setEditDraft((current) => current ? { ...current, [key]: value } : current)
  }

  function saveEditDraft() {
    if (!editDraft) return
    const original = visibleDocuments.find((document) => document.id === editDraft.id)
    if (!original) return
    const nextCreatedAt = editDraft.date ? `${editDraft.date}T${original.createdAt.slice(11, 19) || "10:00:00"}.000Z` : original.createdAt
    const nextDocument: Partial<DmsDocument> = {
      name: editDraft.name.trim() || original.name,
      originalName: editDraft.name.trim() || original.originalName,
      documentType: editDraft.documentType,
      status: editDraft.status,
      createdAt: nextCreatedAt,
      customer: { ...(original.customer || { id: `${editDraft.id}-customer` }), name: editDraft.customer.trim() || "-" },
      project: { ...(original.project || { id: `${editDraft.id}-project` }), name: editDraft.project.trim() || "-" }
    }
    setDocumentEdits((current) => ({ ...current, [editDraft.id]: { ...current[editDraft.id], ...nextDocument } }))
    setEditDraft(null)
    setEditDragStart(null)
    setNotice(`Dokument aktualisiert: ${nextDocument.name}`)
  }

  function deleteDocument(documentItem: DmsDocument) {
    if (!window.confirm(`${documentItem.name} wirklich loeschen?`)) return
    setDeletedIds((current) => [...new Set([...current, documentItem.id])])
    setSelectedIds((current) => {
      const next = current.filter((id) => id !== documentItem.id)
      if (!next.length) setMultiSelect(false)
      return next
    })
    if (selectedId === documentItem.id) setSelectedId("")
    setNotice(`Dokument geloescht: ${documentItem.name}`)
  }

  function toggleFullscreen() {
    setPreviewOffset({ x: 0, y: 0 })
    setPreviewZoom(104)
    setPreviewStatus("DIN-A4 Ansicht angepasst.")
  }

  function createFolder() {
    const name = folderDraft.trim()
    if (!name) return
    setFolders((current) => current.includes(name) ? current : [...current, name])
    setFolderDraft("")
    setActiveTab("new_folder")
    setNotice(`Ordner erstellt: ${name}`)
  }

  function startEditDrag(event: ReactMouseEvent<HTMLElement>) {
    if (window.innerWidth < 769) return
    setEditDragStart({ x: event.clientX, y: event.clientY, offsetX: editOffset.x, offsetY: editOffset.y })
  }

  function moveEditDialog(event: ReactMouseEvent<HTMLDivElement>) {
    if (!editDragStart) return
    setEditOffset({
      x: editDragStart.offsetX + event.clientX - editDragStart.x,
      y: editDragStart.offsetY + event.clientY - editDragStart.y
    })
  }

  function startDrag(event: ReactMouseEvent<HTMLElement>) {
    if (window.innerWidth < 769) return
    setDragStart({ x: event.clientX, y: event.clientY, offsetX: previewOffset.x, offsetY: previewOffset.y })
  }

  function movePreview(event: ReactMouseEvent<HTMLDivElement>) {
    if (!dragStart) return
    setPreviewOffset({
      x: dragStart.offsetX + event.clientX - dragStart.x,
      y: dragStart.offsetY + event.clientY - dragStart.y
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.backButton} href="/dashboard-v2" aria-label="Zurueck">
            <ArrowLeft size={18} />
          </Link>
          <div className={styles.titleBlock}>
            <h1>Dokumente</h1>
            <p>Arbeitszentrale fuer Uploads, Vorschau, Zuordnung, Versionen, OCR-Vorbereitung und Archivierung.</p>
          </div>
        </header>

        <section className={styles.tabs} aria-label="Dokument-Kategorien">
          <div className={styles.tabList}>
            {tabs.map(([value, label]) => {
              const isAll = value === "all"
              const isActive = activeTab === value || (isAll && multiSelect)
              return (
                <button
                  className={isActive ? styles.activeTab : ""}
                  key={value}
                  type="button"
                  onClick={isAll ? toggleAllSelection : () => {
                    if (value === "new_folder") setFolderDraft("Neuer Ordner")
                    setActiveTab(value)
                    setMultiSelect(false)
                    setSelectedIds([])
                  }}
                >
                  {isAll && multiSelect ? (
                    <span className={allVisibleSelected ? styles.checkedBox : styles.checkBox} aria-hidden="true">
                      {allVisibleSelected ? <Square size={18} fill="currentColor" /> : <Square size={18} />}
                    </span>
                  ) : null}
                  {label}{isAll && selectedIds.length ? ` (${selectedIds.length})` : ""}
                </button>
              )
            })}
          </div>
          <label className={styles.inlineSearch}>
            <Search size={19} />
            <input aria-label="Dokumente suchen" value={filters.q} onChange={(event) => updateFilter("q", event.target.value)} placeholder="Suche" autoComplete="off" spellCheck={false} />
          </label>
        </section>

        {notice ? <p className={styles.notice}>{notice}</p> : null}

        <section className={styles.workspaceFull}>
          <div className={styles.tableWrap}>
            <div className={styles.table} role="table" aria-label="Dokumentliste">
              <div className={styles.tableHead} role="row">
                <span>Name</span>
                <span>Kunde</span>
                <span>Projekt</span>
                <span>Typ</span>
                <span>Datum</span>
                <span>Status</span>
                <span>Aktionen</span>
              </div>
              {visibleDocuments.map((document) => (
                <button className={selectedDocument?.id === document.id ? styles.selectedRow : styles.tableRow} key={document.id} type="button" onClick={() => selectDocument(document)}>
                  <span className={styles.nameCell}>
                    {multiSelect ? (
                      <span className={selectedIds.includes(document.id) ? styles.checkedBox : styles.checkBox} aria-hidden="true">
                        {selectedIds.includes(document.id) ? <Square size={18} fill="currentColor" /> : <Square size={18} />}
                      </span>
                    ) : document.mimeType.startsWith("image/") ? <FileImage size={18} /> : <FileText size={18} />}
                    <span>
                      <strong>{document.name}</strong>
                      <small>{formatSize(document.size)}</small>
                    </span>
                  </span>
                  <span>{document.customer?.name || "-"}</span>
                  <span>{document.project?.name || "-"}</span>
                  <span><em className={styles.typePill}>{documentTypeLabel(document.documentType)}</em></span>
                  <span>{formatDate(document.createdAt)}</span>
                  <span><em className={styles.statusPill}>{statusLabels[document.status] || document.status}</em></span>
                  <span className={styles.rowActions}>
                    <button type="button" aria-label="Anzeigen" onClick={(event) => { event.stopPropagation(); setSelectedId(document.id) }}><Eye size={16} /></button>
                    <button type="button" aria-label="Bearbeiten" onClick={(event) => { event.stopPropagation(); editDocument(document) }}><Edit3 size={15} /></button>
                    <button type="button" aria-label="Download" onClick={(event) => { event.stopPropagation(); downloadDocument(document) }}><Download size={16} /></button>
                    <button type="button" aria-label="Teilen" onClick={(event) => { event.stopPropagation(); openShareDialog(document) }}><Share2 size={15} /></button>
                    <button type="button" aria-label="Loeschen" onClick={(event) => { event.stopPropagation(); deleteDocument(document) }}><Trash2 size={16} /></button>
                  </span>
                </button>
              ))}
              {!visibleDocuments.length ? <div className={styles.emptyState}><Search size={18} />Keine Dokumente gefunden.</div> : null}
            </div>
          </div>
        </section>
      </div>
      {documentForShare ? (
        <ShareReleaseDialog label="Dokumentenfreigabe" itemName={documentForShare.name} itemUrl={documentUrl(documentForShare)} onClose={() => setShareDocumentId("")} />
      ) : null}
      {folderDraft ? (
        <div className={styles.modalOverlay} role="dialog" aria-modal="true" aria-labelledby="new-folder-title" onMouseDown={() => setFolderDraft("")}>
          <div className={styles.editModal} onMouseDown={(event) => event.stopPropagation()}>
            <header className={styles.editHead}>
              <div>
                <h2 id="new-folder-title">Neu Ordner</h2>
                <p>Ordner wird als Unterkategorie in dieser Ansicht vorbereitet.</p>
              </div>
              <button type="button" aria-label="Dialog schliessen" onClick={() => setFolderDraft("")}><X size={18} /></button>
            </header>
            <div className={styles.editGrid}>
              <label>
                <span>Ordnername</span>
                <input value={folderDraft} onChange={(event) => setFolderDraft(event.target.value)} autoFocus />
              </label>
              {folders.length ? (
                <div className={styles.folderList}>
                  {folders.map((folder) => <span key={folder}>{folder}</span>)}
                </div>
              ) : null}
            </div>
            <footer className={styles.editActions}>
              <button type="button" onClick={() => setFolderDraft("")}>Abbrechen</button>
              <button type="button" onClick={createFolder}>Erstellen</button>
            </footer>
          </div>
        </div>
      ) : null}
      {editDraft ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-document-title"
          onMouseDown={() => setEditDraft(null)}
          onMouseMove={moveEditDialog}
          onMouseUp={() => setEditDragStart(null)}
          onMouseLeave={() => setEditDragStart(null)}
        >
          <div
            className={styles.editModal}
            style={{ transform: `translate(${editOffset.x}px, ${editOffset.y}px)` }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.editHead} onMouseDown={startEditDrag}>
              <div>
                <h2 id="edit-document-title">Dokument bearbeiten</h2>
                <p>Aenderungen werden direkt in dieser Dokumentliste uebernommen.</p>
              </div>
              <button type="button" aria-label="Dialog schliessen" onClick={() => setEditDraft(null)}><X size={18} /></button>
            </header>
            <div className={styles.editGrid}>
              <label>
                <span>Dateiname</span>
                <input value={editDraft.name} onChange={(event) => updateEditDraft("name", event.target.value)} />
              </label>
              <label>
                <span>Kunde</span>
                <input value={editDraft.customer} onChange={(event) => updateEditDraft("customer", event.target.value)} />
              </label>
              <label>
                <span>Projekt</span>
                <input value={editDraft.project} onChange={(event) => updateEditDraft("project", event.target.value)} />
              </label>
              <label>
                <span>Typ</span>
                <select value={editDraft.documentType} onChange={(event) => updateEditDraft("documentType", event.target.value)}>
                  {typeOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Status</span>
                <select value={editDraft.status} onChange={(event) => updateEditDraft("status", event.target.value)}>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
              </label>
              <label>
                <span>Datum</span>
                <input type="date" value={editDraft.date} onChange={(event) => updateEditDraft("date", event.target.value)} />
              </label>
            </div>
            <footer className={styles.editActions}>
              <button type="button" onClick={() => setEditDraft(null)}>Abbrechen</button>
              <button type="button" onClick={saveEditDraft}>Speichern</button>
            </footer>
          </div>
        </div>
      ) : null}
      {selectedDocument ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="document-preview-title"
          onMouseDown={closePreview}
          onMouseMove={movePreview}
          onMouseUp={() => setDragStart(null)}
          onMouseLeave={() => setDragStart(null)}
        >
          <div
            className={styles.previewModal}
            data-preview-modal
            style={{ transform: `translate(${previewOffset.x}px, ${previewOffset.y}px)` }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className={styles.modalHead} onMouseDown={startDrag}>
              <div className={styles.modalTitle}>
                <FileText size={18} />
                <strong id="document-preview-title">{selectedDocument.name}</strong>
              </div>
              <button type="button" aria-label="Vorschau schliessen" onClick={closePreview}><X size={18} /></button>
            </header>
            <div className={styles.modalTools} aria-label="Vorschau-Werkzeuge">
              <span>1</span><small>/1</small>
              <button type="button" aria-label="Verkleinern" onClick={() => setPreviewZoom((current) => Math.max(70, current - 10))}>-</button>
              <strong>{previewZoom}%</strong>
              <button type="button" aria-label="Vergroessern" onClick={() => setPreviewZoom((current) => Math.min(140, current + 10))}>+</button>
              <button type="button" aria-label="Vollbild" onClick={toggleFullscreen}><Maximize2 size={15} /></button>
              <button type="button" aria-label="Scan OCR" onClick={scanPreview}><ScanLine size={15} /></button>
              <button type="button" aria-label="E-Mail" onClick={emailPreview}><Mail size={15} /></button>
              <button type="button" aria-label="Download" onClick={downloadPreview}><Download size={15} /></button>
              <button type="button" aria-label="Drucken" onClick={printPreview}><Printer size={15} /></button>
              <button type="button" aria-label="Teilen" onClick={() => void sharePreview()}><Share2 size={15} /></button>
            </div>
            {previewStatus ? <p className={styles.previewStatus}>{previewStatus}</p> : null}
            <div className={styles.a4Stage}>
              <div className={styles.a4Paper} style={{ transform: `scale(${previewZoom / 100})` }}>
                {selectedDocument.documentType === "invoice" ? (
                  <div className={styles.invoiceA4}>
                    <div className={styles.a4Top}><strong>DreamInvoice</strong></div>
                    <div className={styles.a4Addresses}><p>DreamInvoice GmbH<br />Musterstraße 1<br />12345 Berlin<br />Deutschland</p><p>Rechnung an<br /><b>{selectedDocument.customer?.name || "-"}</b><br />Musterstraße 1<br />12345 Berlin<br />Deutschland</p></div>
                    <div className={styles.a4Meta}><p>Rechnungsdatum:<b>{formatDate(selectedDocument.createdAt)}</b></p><p>Faelligkeitsdatum:<b>07.06.2026</b></p><p>Kundennummer:<b>10001</b></p><p>Rechnungsnummer:<b>{selectedDocument.invoice?.number || selectedDocument.name.replace(".pdf", "")}</b></p></div>
                    <p className={styles.a4Intro}>Sehr geehrte Damen und Herren,<br />vielen Dank fuer Ihr Vertrauen in unsere Dienstleistungen. Hiermit stellen wir Ihnen folgende Leistungen in Rechnung:</p>
                    <table><thead><tr><th>Beschreibung</th><th>Menge</th><th>Einzelpreis</th><th>Gesamtpreis</th></tr></thead><tbody><tr><td>Webdesign Paket</td><td>1</td><td>1.200,00 EUR</td><td>1.200,00 EUR</td></tr><tr><td>SEO Optimierung</td><td>1</td><td>600,00 EUR</td><td>600,00 EUR</td></tr><tr><td>Wartung (12 Monate)</td><td>1</td><td>240,00 EUR</td><td>240,00 EUR</td></tr></tbody></table>
                    <div className={styles.a4Totals}><p><span>Zwischensumme</span><b>2.040,00 EUR</b></p><p><span>USt. (19%)</span><b>387,60 EUR</b></p><p><strong>Gesamtbetrag</strong><strong>2.427,60 EUR</strong></p></div>
                    <p className={styles.a4Footer}>Zahlungsziel: 14 Tage ohne Abzug.<br />Wir freuen uns auf die weitere Zusammenarbeit.<br /><br />Mit freundlichen Gruessen<br />DreamInvoice GmbH</p>
                  </div>
                ) : (
                  <div className={styles.previewFallback}><FileText size={44} /><strong>{documentTypeLabel(selectedDocument.documentType)}</strong><span>{selectedDocument.mimeType}</span></div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}
