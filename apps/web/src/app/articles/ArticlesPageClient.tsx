"use client"

import {
  AlertCircle,
  Check,
  Copy,
  FileUp,
  Grid2X2,
  List,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Trash2,
  X
} from "lucide-react"
import { useMemo, useState } from "react"
import useSWR from "swr"
import { Input } from "@dream-invoice/ui"
import { articles as fallbackArticles } from "@/data/invoice-data"
import { useLanguage } from "@/lib/i18n"
import { jsonFetcher, listCacheOptions } from "@/lib/swr/fetcher"
import { StandardModal } from "@/components/ui/StandardModal"

type ViewMode = "grid" | "list"

type ArticleItem = {
  id: string
  name: string
  code?: string
  category?: string
  description?: string
  price?: number
  unit?: string
  tax?: number
}

type ArticleListResponse = {
  ok: boolean
  articles?: ArticleItem[]
}

type ImportRow = {
  id: string
  name: string
  code: string
  category: string
  price: string
  unit: string
  tax: string
}

type ArticleForm = {
  name: string
  code: string
  category: string
  price: string
  unit: string
  tax: string
  description: string
}

const emptyForm: ArticleForm = {
  name: "",
  code: "",
  category: "",
  price: "",
  unit: "Stk",
  tax: "19",
  description: ""
}

function formatPrice(value: number, language: string) {
  return value.toLocaleString(language === "en" ? "en-US" : "de-DE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function articleToForm(article: ArticleItem): ArticleForm {
  return {
    name: article.name || "",
    code: article.code || "",
    category: article.category || "",
    price: String(article.price ?? ""),
    unit: article.unit || "Stk",
    tax: String(article.tax ?? 19),
    description: article.description || ""
  }
}

function TaxRateControl({
  value,
  onChange,
  label,
  customLabel
}: {
  value: string
  onChange: (value: string) => void
  label: string
  customLabel: string
}) {
  const normalized = String(value || "").replace("%", "").trim()
  const isSeven = normalized === "7"
  const isNineteen = normalized === "19"
  const isCustom = Boolean(normalized) && !isSeven && !isNineteen

  const optionClass = (active: boolean) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${active
      ? "bg-[var(--brand-lime)] text-black shadow-sm ring-1 ring-black/10"
      : "bg-white text-[#64748b] hover:text-[#111827]"
    }`

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-widest text-[#94a3b8]">
        {label}
      </p>

      <div className="rounded-[22px] bg-[#f5f7fa] p-2 ring-1 ring-[#e1e7ef]">
        <div className="grid grid-cols-3 gap-2">
          <button type="button" onClick={() => onChange("19")} className={optionClass(isNineteen)}>
            19%
          </button>

          <button type="button" onClick={() => onChange("7")} className={optionClass(isSeven)}>
            7%
          </button>

          <div className={`flex h-10 min-w-0 items-center rounded-full px-3 transition ${isCustom
            ? "bg-[var(--brand-lime)] text-black shadow-sm ring-1 ring-black/10"
            : "bg-white text-[#64748b] ring-1 ring-[#e1e7ef]"
          }`}>
            <input
              value={isCustom ? normalized : ""}
              onChange={(event) => onChange(event.target.value)}
              placeholder={customLabel}
              inputMode="decimal"
              className="min-w-0 flex-1 bg-transparent text-center text-sm font-semibold outline-none placeholder:text-[#94a3b8]"
            />
            <span className="text-sm font-semibold">%</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ArticlesPage() {
  const { language, t } = useLanguage()
  const [view, setView] = useState<ViewMode>("grid")
  const [query, setQuery] = useState("")
  const [taxMode, setTaxMode] = useState<"net" | "gross">("net")
  const [category, setCategory] = useState("Alle")
  const [panelOpen, setPanelOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingArticle, setEditingArticle] = useState<ArticleItem | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [importStep, setImportStep] = useState<"upload" | "preview">("upload")
  const [fileName, setFileName] = useState("")
  const [importRows, setImportRows] = useState<ImportRow[]>([])
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState("")
  const [form, setForm] = useState<ArticleForm>(emptyForm)
  const [editForm, setEditForm] = useState<ArticleForm>(emptyForm)
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null)
  const [selectedArticleIds, setSelectedArticleIds] = useState<string[]>([])
  const [notice, setNotice] = useState("")
  const isEditingInline = editOpen && Boolean(editingArticle)
  const { data: articleData, mutate: refreshArticles, isLoading } = useSWR<ArticleListResponse>(
    "/api/articles/list",
    jsonFetcher,
    {
      ...listCacheOptions,
      fallbackData: { ok: true, articles: fallbackArticles }
    }
  )
  const items = useMemo(
    () => (articleData?.ok && Array.isArray(articleData.articles) && articleData.articles.length > 0
      ? articleData.articles
      : fallbackArticles),
    [articleData]
  )

  const categories = useMemo(() => [
    "Alle",
    ...Array.from(new Set(items.map((article) => article.category || "Sonstiges")))
  ], [items])

  const categoryLabel = (value: string) => {
    if (value === "Alle") return t("articles.filters.all")
    if (value === "Sonstiges") return t("articles.fallback.category")
    return value
  }

  const editableCategories = useMemo(() => {
    const values = categories.filter((item) => item !== "Alle")
    if (editForm.category && !values.includes(editForm.category)) {
      values.unshift(editForm.category)
    }

    return values.length ? values : ["Dienstleistung", "Consulting", "Entwicklung", "Hosting", "Webdesign"]
  }, [categories, editForm.category])

  const unitOptions = ["Std", "Stk", "Pauschale", "Tag", "Monat", "Kilometer"]

  const unitLabel = (value: string) => {
    if (value === "Std") return "Stunde"
    if (value === "Stk") return "Stück"
    return value
  }

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase()

    return items.filter((article) => {
      const matchesQuery = !search || `${article.name} ${article.code ?? ""} ${article.category ?? ""} ${article.unit ?? ""}`.toLowerCase().includes(search)
      const matchesCategory = category === "Alle" || (article.category || "Sonstiges") === category

      return matchesQuery && matchesCategory
    })
  }, [items, query, category])

  const allFilteredSelected = filtered.length > 0 && filtered.every((article) => selectedArticleIds.includes(article.id))

  function updateForm(field: keyof ArticleForm, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function updateEditForm(field: keyof ArticleForm, value: string) {
    setEditForm((current) => ({ ...current, [field]: value }))
  }

  async function createArticle() {
    const response = await fetch("/api/articles/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      alert(result.error || t("articles.messages.createFailed"))
      return
    }

    setForm(emptyForm)
    setPanelOpen(false)
    await refreshArticles()
  }

  function openEdit(article: ArticleItem) {
    setActiveArticleId(article.id)
    setEditingArticle(article)
    setEditForm(articleToForm(article))
    setEditOpen(true)
  }

  function toggleArticleSelection(articleId: string) {
    setSelectedArticleIds((current) =>
      current.includes(articleId) ? current.filter((id) => id !== articleId) : [...current, articleId]
    )
  }

  function toggleAllFilteredArticles() {
    setSelectedArticleIds((current) => {
      if (allFilteredSelected) {
        return current.filter((id) => !filtered.some((article) => article.id === id))
      }

      return Array.from(new Set([...current, ...filtered.map((article) => article.id)]))
    })
  }

  function uniqueCopyName(article: ArticleItem) {
    const baseName = article.name.replace(/\s+\(Kopie(?: \d+)?\)$/i, "").trim() || article.name
    const existingNames = new Set(items.map((item) => item.name.toLowerCase()))
    let candidate = `${baseName} (Kopie)`
    let index = 2

    while (existingNames.has(candidate.toLowerCase())) {
      candidate = `${baseName} (Kopie ${index})`
      index += 1
    }

    return candidate
  }

  function uniqueCopyCode(article: ArticleItem) {
    const baseCode = (article.code || "ART").replace(/-COPY(?:-\d+)?$/i, "")
    const existingCodes = new Set(items.map((item) => (item.code || "").toLowerCase()).filter(Boolean))
    let candidate = `${baseCode}-COPY`
    let index = 2

    while (existingCodes.has(candidate.toLowerCase())) {
      candidate = `${baseCode}-COPY-${index}`
      index += 1
    }

    return candidate
  }

  async function duplicateArticle(article: ArticleItem) {
    setActiveArticleId(article.id)
    const copyName = uniqueCopyName(article)

    const response = await fetch("/api/articles/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...articleToForm(article),
        name: copyName,
        code: uniqueCopyCode(article)
      })
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      alert(result.error || t("articles.messages.createFailed"))
      return
    }

    setNotice(`Artikel "${copyName}" wurde dupliziert.`)
    setActiveArticleId(result.article?.id ?? article.id)
    await refreshArticles()
    window.setTimeout(() => setNotice(""), 3600)
  }

  async function updateArticle() {
    if (!editingArticle) return

    const response = await fetch(`/api/articles/update/${editingArticle.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm)
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      alert(result.error || t("articles.messages.updateFailed"))
      return
    }

    setEditOpen(false)
    setEditingArticle(null)
    await refreshArticles()
  }

  async function deleteArticle(article: ArticleItem) {
    const confirmed = window.confirm(t("articles.messages.confirmDelete").replace("{name}", article.name))
    if (!confirmed) return

    const response = await fetch(`/api/articles/delete/${article.id}`, {
      method: "DELETE"
    })

    const result = await response.json()

    if (!response.ok || !result.ok) {
      alert(result.error || t("articles.messages.deleteFailed"))
      return
    }

    await refreshArticles()
  }

  async function recognizeImportFile(file: File) {
    setFileName(file.name)
    setImportLoading(true)
    setImportError("")

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/import/articles", {
        method: "POST",
        body: formData
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.warnings?.[0] || result.error || t("articles.messages.recognizeFailed"))
      }

      setImportRows(
        result.articles.map((article: any, index: number) => ({
          id: `import-${index}`,
          name: article.name || "",
          code: article.number || "",
          category: article.category || "",
          price: String(article.netPrice ?? ""),
          unit: article.unit || "Stk",
          tax: String(article.vatRate ?? 19)
        }))
      )

      setImportStep("preview")
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t("articles.messages.recognizeFailed"))
    } finally {
      setImportLoading(false)
    }
  }

  function updateImportRow(id: string, field: keyof ImportRow, value: string) {
    setImportRows((rows) =>
      rows.map((row) => row.id === id ? { ...row, [field]: value } : row)
    )
  }

  function removeImportRow(id: string) {
    setImportRows((rows) => rows.filter((row) => row.id !== id))
  }

  async function importArticles() {
    setImportLoading(true)
    setImportError("")

    try {
      const response = await fetch("/api/articles/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articles: importRows })
    })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        throw new Error(result.error || t("articles.messages.importFailed"))
      }

      setImportOpen(false)
      setImportStep("upload")
      setFileName("")
      setImportRows([])
      await refreshArticles()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t("articles.messages.importFailed"))
    } finally {
      setImportLoading(false)
    }
  }

  function ArticleActions({ article }: { article: ArticleItem }) {
    const isActive = activeArticleId === article.id

    return (
      <div className={`flex items-center gap-2 transition duration-200 group-hover/article:opacity-100 group-focus-within/article:opacity-100 ${isActive ? "opacity-100" : "opacity-0"}`}>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            duplicateArticle(article)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#64748b] shadow-sm ring-1 ring-[#dfe6ee] hover:bg-[#f7f9fc] hover:text-[#111827]"
          aria-label="Artikel duplizieren"
          title="Artikel duplizieren"
        >
          <Copy className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            openEdit(article)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#64748b] shadow-sm ring-1 ring-[#dfe6ee] hover:bg-[#f7f9fc] hover:text-[#111827]"
          aria-label={t("articles.actions.editArticle")}
          title={t("articles.actions.editArticle")}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            deleteArticle(article)
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-red-500 shadow-sm ring-1 ring-[#f1d5d5] hover:bg-red-50 hover:text-red-600"
          aria-label={t("articles.actions.deleteArticle")}
          title={t("articles.actions.deleteArticle")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className={`mx-auto max-w-[1840px] ${isEditingInline ? "grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]" : ""}`}>
      <section className={`rounded-[34px] border border-[#e3e9f1] bg-white p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)] ${isEditingInline ? "min-w-0" : ""}`}>
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="max-w-[520px] text-[32px] font-extrabold leading-[1.1] tracking-tight text-[#111827] sm:text-[34px] lg:text-[34px]">
              {t("articles.overview.title")}
            </h1>
            <p className="mt-3 text-base font-semibold text-[#64748b] sm:text-lg">
              {t("articles.overview.description")}
            </p>
            <p className="mt-2 text-sm font-extrabold text-[#94a3b8]">
              {isLoading ? t("articles.overview.loading") : t("articles.overview.entries").replace("{count}", String(items.length))}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-full bg-[#eceff3] p-1">
              <button onClick={() => setTaxMode("net")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${taxMode === "net" ? "bg-white text-[#111827] shadow-sm" : "text-[#7b8799]"}`}>
                {t("articles.tax.net")}
              </button>
              <button onClick={() => setTaxMode("gross")} className={`rounded-full px-4 py-2 text-sm font-medium transition ${taxMode === "gross" ? "bg-white text-[#111827] shadow-sm" : "text-[#7b8799]"}`}>
                {t("articles.tax.gross")}
              </button>
            </div>

            <div className="inline-flex rounded-full bg-[#eceff3] p-1">
              <button onClick={() => setView("grid")} className={`flex h-9 w-10 items-center justify-center rounded-full transition ${view === "grid" ? "bg-white text-[#111827] shadow-sm" : "text-[#7b8799]"}`} aria-label={t("articles.view.grid")}>
                <Grid2X2 className="h-4 w-4" />
              </button>
              <button onClick={() => setView("list")} className={`flex h-9 w-10 items-center justify-center rounded-full transition ${view === "list" ? "bg-white text-[#111827] shadow-sm" : "text-[#7b8799]"}`} aria-label={t("articles.view.list")}>
                <List className="h-4 w-4" />
              </button>
            </div>

            <a href="/api/articles/import-template" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#111827] no-underline shadow-sm ring-1 ring-[#e1e7ef] hover:bg-[#f8fafc]">
              {t("articles.actions.template")}
            </a>

            <a href="/api/articles/export" className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#111827] no-underline shadow-sm ring-1 ring-[#e1e7ef] hover:bg-[#f8fafc]">
              {t("articles.actions.export")}
            </a>

            <button onClick={() => setImportOpen(true)} className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-[#111827] shadow-sm ring-1 ring-[#e1e7ef] hover:bg-[#f8fafc]">
              <FileUp className="h-5 w-5" />
              {t("articles.actions.import")}
            </button>

            <button onClick={() => setPanelOpen(true)} className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-lime)] text-black shadow-sm transition hover:brightness-95" aria-label={t("articles.actions.newArticle")}>
              <Plus className="h-7 w-7 stroke-[3]" />
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex h-12 w-full max-w-[390px] items-center gap-3 rounded-full bg-white px-5 shadow-sm ring-1 ring-[#e1e7ef]">
            <Search className="h-5 w-5 text-[#94a3b8]" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full bg-transparent text-sm font-semibold text-[#334155] outline-none placeholder:text-[#94a3b8]" placeholder={t("articles.search.placeholder")} />
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button key={item} onClick={() => setCategory(item)} className={`rounded-full px-4 py-2 text-sm font-medium transition ${category === item ? "bg-black text-white shadow-sm" : "bg-[#eceff3] text-[#64748b] hover:bg-[#e3e8ef]"}`}>
                {categoryLabel(item)}
              </button>
            ))}
          </div>
        </div>

        {notice ? (
          <div className="mt-5 flex items-center gap-3 rounded-[24px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-extrabold text-emerald-700 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-emerald-600 shadow-sm ring-1 ring-emerald-100">
              <Check className="h-4 w-4" />
            </span>
            <span>{notice}</span>
          </div>
        ) : null}

        {view === "grid" ? (
          <div className={`mt-8 grid gap-5 md:grid-cols-2 ${isEditingInline ? "xl:grid-cols-3" : "xl:grid-cols-3 2xl:grid-cols-4"}`}>
            {filtered.map((article) => {
              const price = taxMode === "gross" ? Number(article.price ?? 0) * (1 + Number(article.tax ?? 19) / 100) : Number(article.price ?? 0)

              return (
                <article
                  key={article.id}
                  tabIndex={0}
                  onClick={() => setActiveArticleId(article.id)}
                  onFocus={() => setActiveArticleId(article.id)}
                  className={`group/article flex min-h-[286px] flex-col rounded-[30px] border bg-[#fbfcfe] p-7 shadow-sm outline-none transition hover:border-[#cfd8e5] hover:bg-white hover:shadow-md focus:border-[#cfd8e5] focus:bg-white focus:shadow-md ${activeArticleId === article.id ? "border-[#cfd8e5] bg-white shadow-md" : "border-[#e5eaf0]"}`}
                >
                  <div className="mb-6 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-base font-black text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                      {(article.name || "AR").slice(0, 2).toUpperCase()}
                    </div>
                    <ArticleActions article={article} />
                  </div>

                  <span className="inline-flex rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-medium uppercase text-[#64748b]">
                    {categoryLabel(article.category || "Sonstiges")}
                  </span>

                  <h2 className="mt-3 min-h-[58px] text-xl font-extrabold leading-tight tracking-tight text-[#111827]">{article.name}</h2>
                  <p className="mt-2 text-sm font-extrabold text-[#a3adbb]">#{article.code || t("articles.fallback.code")}</p>

                  <div className="mt-auto border-t border-[#edf2f7] pt-6">
                    <p className="text-xs font-black uppercase tracking-widest text-[#a3adbb]">{t("articles.price.label").replace("{mode}", taxMode === "net" ? t("articles.tax.net") : t("articles.tax.gross"))}</p>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <p className="text-[32px] font-black leading-none tracking-tight text-black">{formatPrice(price, language)} €</p>
                      <p className="pb-1 text-sm font-extrabold text-[#a3adbb]">/ {article.unit || t("articles.units.pieceShort")}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8">
            <div className="hidden grid-cols-[42px_minmax(240px,1.55fr)_minmax(135px,0.7fr)_78px_minmax(150px,0.7fr)_136px] items-center px-7 pb-3 text-xs font-black uppercase tracking-[0.16em] text-[#a3adbb] lg:grid">
              <button
                type="button"
                onClick={toggleAllFilteredArticles}
                className={`flex !h-[18px] !min-h-0 !w-[18px] shrink-0 items-center justify-center rounded-full border p-0 transition ${allFilteredSelected ? "border-black bg-black text-[var(--brand-lime)] shadow-sm" : "border-[#d9e1ea] bg-white text-transparent hover:border-[#aab6c4]"}`}
                aria-label="Alle Artikel auswählen"
                aria-pressed={allFilteredSelected}
              >
                <Check className="h-3 w-3 stroke-[3]" />
              </button>
              <span>Artikel / Leistung</span>
              <span>SKU / Kat</span>
              <span>USt</span>
              <span className="text-right">Preis ({taxMode === "net" ? t("articles.tax.net") : t("articles.tax.gross")})</span>
              <span className="text-right">Aktionen</span>
            </div>

            <div className="space-y-3">
              {filtered.map((article) => {
                const price = taxMode === "gross" ? Number(article.price ?? 0) * (1 + Number(article.tax ?? 19) / 100) : Number(article.price ?? 0)
                const active = activeArticleId === article.id
                const selected = selectedArticleIds.includes(article.id)

                return (
                  <article
                    key={article.id}
                    tabIndex={0}
                    onClick={() => setActiveArticleId(article.id)}
                    onFocus={() => setActiveArticleId(article.id)}
                    className={`group/article grid gap-4 rounded-[28px] border bg-[#fbfcfe] px-6 py-5 shadow-sm outline-none transition hover:border-[#cfd8e5] hover:bg-white hover:shadow-md focus:border-[#cfd8e5] focus:bg-white focus:shadow-md lg:grid-cols-[42px_minmax(240px,1.55fr)_minmax(135px,0.7fr)_78px_minmax(150px,0.7fr)_136px] lg:items-center ${selected ? "border-[#8fb4ff] bg-[#f8fbff] shadow-md" : active ? "border-[#cfd8e5] bg-white shadow-md" : "border-[#e5eaf0]"}`}
                  >
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation()
                        toggleArticleSelection(article.id)
                      }}
                      className={`hidden !h-[18px] !min-h-0 !w-[18px] shrink-0 items-center justify-center rounded-full border p-0 transition lg:flex ${selected ? "border-black bg-black text-[var(--brand-lime)] shadow-sm" : "border-[#d9e1ea] bg-white text-transparent group-hover/article:border-[#aab6c4]"}`}
                      aria-label={`${article.name} auswählen`}
                      aria-pressed={selected}
                    >
                      <Check className="h-3 w-3 stroke-[3]" />
                    </button>

                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-black text-emerald-600 shadow-sm ring-1 ring-emerald-100">
                        {(article.name || "AR").slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-extrabold text-[#111827]">{article.name}</p>
                        <p className="mt-1 truncate text-sm font-semibold text-[#64748b]">
                          {article.description || `${categoryLabel(article.category || "Sonstiges")} und Leistung`}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-lg bg-white px-2.5 py-1 text-xs font-black uppercase tracking-wide text-[#8b97a8] ring-1 ring-[#e1e7ef]">
                        #{article.code || t("articles.fallback.code")}
                      </span>
                      <span className="rounded-lg bg-[#e7ebf0] px-2.5 py-1 text-xs font-black uppercase tracking-wide text-[#5f6b7a]">
                        {categoryLabel(article.category || "Sonstiges")}
                      </span>
                    </div>

                    <span className="w-fit rounded-lg bg-[#eef2f7] px-3 py-1 text-xs font-black text-[#64748b]">
                      {article.tax ?? "19"}%
                    </span>

                    <div className="text-left lg:text-right">
                      <p className="text-xl font-black tracking-tight text-black">{formatPrice(price, language)} €</p>
                      <p className="mt-1 text-xs font-extrabold text-[#a3adbb]">pro {article.unit || t("articles.units.pieceShort")}</p>
                    </div>

                    <div className="flex justify-start lg:justify-end">
                      <ArticleActions article={article} />
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {editOpen && editingArticle && (
        <aside className="sticky top-6 flex h-[calc(100vh-48px)] min-h-[720px] flex-col overflow-hidden rounded-[34px] border border-[#e3e9f1] bg-white shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf2f7] px-7 py-6">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight text-[#111827]">{t("articles.edit.title")}</h2>
                <p className="mt-1 text-sm font-semibold text-[#94a3b8]">ID: {editingArticle.id}</p>
              </div>

              <button
                onClick={() => setEditOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]"
                aria-label={t("articles.actions.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-6 overflow-auto px-7 py-6">
              <div className="grid grid-cols-[1fr_0.72fr] gap-4">
                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#7b8799]">Bezeichnung *</span>
                  <input
                    value={editForm.name}
                    onChange={(event) => updateEditForm("name", event.target.value)}
                    className="h-14 w-full rounded-full border border-[#dfe6ee] bg-[#f8fafc] px-5 text-sm font-extrabold text-[#111827] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#7b8799]">Artikel-Nr.</span>
                  <input
                    value={editForm.code}
                    onChange={(event) => updateEditForm("code", event.target.value)}
                    className="h-14 w-full rounded-full border border-[#dfe6ee] bg-[#f8fafc] px-5 text-sm font-extrabold text-[#111827] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                  />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#7b8799]">Kategorie</span>
                <select
                  value={editForm.category}
                  onChange={(event) => updateEditForm("category", event.target.value)}
                  className="h-14 w-full appearance-none rounded-full border border-[#dfe6ee] bg-[#f8fafc] px-5 text-sm font-extrabold text-[#111827] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                >
                  {editableCategories.map((item) => (
                    <option key={item} value={item}>{categoryLabel(item)}</option>
                  ))}
                </select>
              </label>

              <div className="border-t border-[#edf2f7] pt-5">
                <h3 className="mb-4 text-lg font-extrabold text-[#111827]">€ {t("articles.edit.pricesTaxes")}</h3>

                <div className="grid grid-cols-[1fr_0.9fr] gap-4">
                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#7b8799]">{t("articles.fields.netPriceRequired")}</span>
                    <input
                      value={editForm.price}
                      onChange={(event) => updateEditForm("price", event.target.value)}
                      className="h-14 w-full rounded-full border border-[#dfe6ee] bg-[#f8fafc] px-5 text-sm font-extrabold text-[#111827] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-xs font-black uppercase tracking-widest text-[#7b8799]">Einheit</span>
                    <select
                      value={editForm.unit}
                      onChange={(event) => updateEditForm("unit", event.target.value)}
                      className="h-14 w-full appearance-none rounded-full border border-[#dfe6ee] bg-[#f8fafc] px-5 text-sm font-extrabold text-[#111827] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                    >
                      {unitOptions.map((item) => (
                        <option key={item} value={item}>{unitLabel(item)}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-4">
                  <TaxRateControl value={editForm.tax} onChange={(value) => updateEditForm("tax", value)} label={t("articles.fields.vat")} customLabel={t("articles.tax.custom")} />
                </div>
              </div>

              <div className="border-t border-[#edf2f7] pt-5">
                <textarea
                  value={editForm.description}
                  onChange={(event) => updateEditForm("description", event.target.value)}
                  className="w-full rounded-[22px] border border-[#dfe6ee] bg-[#f7f9fc] px-4 py-3 text-sm font-semibold text-[#334155] outline-none transition focus:border-[var(--brand-lime)] focus:ring-2 focus:ring-[rgba(210,255,57,0.55)]"
                  rows={5}
                  placeholder={t("articles.fields.description")}
                />
                <p className="mt-2 text-xs font-medium text-[#94a3b8]">
                  {t("articles.edit.invoiceHint")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 border-t border-[#edf2f7] bg-white px-7 py-5">
              <button
                onClick={() => deleteArticle(editingArticle)}
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-sm ring-1 ring-[#f1d5d5] hover:bg-red-50"
                aria-label={t("articles.actions.deleteArticle")}
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <button
                onClick={updateArticle}
                className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-full bg-black px-7 text-base font-extrabold text-[var(--brand-lime)] shadow-sm"
              >
                <Check className="h-4 w-4" />
                {t("articles.actions.save")}
              </button>
            </div>
        </aside>
      )}

      {importOpen && (
        <StandardModal
          title={t("articles.import.title")}
          description={t("articles.import.description")}
          onClose={() => { setImportOpen(false); setImportError("") }}
          width={960}
        >

            {importError && (
              <div className="mt-5 flex items-center gap-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-black text-red-700">
                <AlertCircle className="h-5 w-5" />
                <span>{importError}</span>
              </div>
            )}

            {importStep === "upload" ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-[#cfd8e5] bg-[#f8fafc] p-8 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-black text-[var(--brand-lime)]">
                  <Sparkles className="h-8 w-8" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-[#111827]">{t("articles.import.uploadTitle")}</h3>
                <p className="mx-auto mt-2 max-w-xl text-sm font-medium text-[#64748b]">{t("articles.import.uploadDescription")}</p>
                <label className={`mt-6 inline-flex cursor-pointer rounded-full px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800 ${importLoading ? "bg-slate-500" : "bg-black"}`}>
                  {importLoading ? t("articles.import.reading") : t("articles.import.chooseFile")}
                  <input type="file" className="hidden" accept=".csv,.txt" onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) recognizeImportFile(file)
                  }} />
                </label>
              </div>
            ) : (
              <div className="mt-6">
                <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{t("articles.import.recognizedFile").replace("{fileName}", fileName)}</p>
                    <p className="mt-1 text-sm font-medium text-[#64748b]">{t("articles.import.previewDescription")}</p>
                  </div>
                  <button onClick={() => setImportStep("upload")} className="rounded-full bg-[#eef2f7] px-4 py-2 text-sm font-medium text-[#334155]">{t("articles.import.otherFile")}</button>
                </div>

                <div className="overflow-hidden rounded-[22px] border border-[#e5eaf0]">
                  <table className="w-full text-sm">
                    <thead className="bg-[#f8fafc] text-left text-xs font-medium uppercase tracking-widest text-[#64748b]">
                      <tr>
                        <th className="px-4 py-3">{t("articles.import.table.article")}</th>
                        <th className="px-4 py-3">{t("articles.import.table.number")}</th>
                        <th className="px-4 py-3">{t("articles.import.table.category")}</th>
                        <th className="px-4 py-3">{t("articles.import.table.netPrice")}</th>
                        <th className="px-4 py-3">{t("articles.import.table.unit")}</th>
                        <th className="px-4 py-3">{t("articles.import.table.vat")}</th>
                        <th className="px-4 py-3"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#edf2f7]">
                      {importRows.map((row) => (
                        <tr key={row.id}>
                          <td className="px-3 py-3"><input value={row.name} onChange={(event) => updateImportRow(row.id, "name", event.target.value)} className="w-full rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3"><input value={row.code} onChange={(event) => updateImportRow(row.id, "code", event.target.value)} className="w-full rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3"><input value={row.category} onChange={(event) => updateImportRow(row.id, "category", event.target.value)} className="w-full rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3"><input value={row.price} onChange={(event) => updateImportRow(row.id, "price", event.target.value)} className="w-28 rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3"><input value={row.unit} onChange={(event) => updateImportRow(row.id, "unit", event.target.value)} className="w-28 rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3"><input value={row.tax} onChange={(event) => updateImportRow(row.id, "tax", event.target.value)} className="w-20 rounded-full bg-[#f3f6fa] px-3 py-2 font-semibold outline-none focus:ring-2 focus:ring-slate-900" /></td>
                          <td className="px-3 py-3 text-right">
                            <button onClick={() => removeImportRow(row.id)} className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100" aria-label={t("articles.import.removeRow")}>
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button onClick={() => setImportStep("upload")} className="rounded-full bg-[#eef2f7] px-5 py-2.5 text-sm font-medium text-[#334155]">{t("articles.actions.back")}</button>
                  <button onClick={importArticles} disabled={importLoading || importRows.length === 0} className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2.5 text-sm font-semibold text-[var(--brand-lime)] disabled:opacity-60">
                    <Check className="h-4 w-4" />
                    {importLoading ? t("articles.import.saving") : t("articles.import.saveArticles")}
                  </button>
                </div>
              </div>
            )}
        </StandardModal>
      )}

      {panelOpen && (
        <StandardModal
          title={t("articles.createPanel.title")}
          description={t("articles.createPanel.description")}
          onClose={() => setPanelOpen(false)}
          width={520}
          bodyClassName="space-y-4"
          footer={<button onClick={createArticle} className="w-full rounded-full bg-black px-5 py-3 font-semibold text-[var(--brand-lime)]">{t("articles.actions.save")}</button>}
        >
              <Input placeholder={t("articles.fields.nameRequired")} value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              <Input placeholder={t("articles.fields.code")} value={form.code} onChange={(event) => updateForm("code", event.target.value)} />
              <Input placeholder={t("articles.fields.category")} value={form.category} onChange={(event) => updateForm("category", event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("articles.fields.netPriceRequired")} value={form.price} onChange={(event) => updateForm("price", event.target.value)} />
                <Input placeholder={t("articles.fields.unit")} value={form.unit} onChange={(event) => updateForm("unit", event.target.value)} />
              </div>
              <TaxRateControl value={form.tax} onChange={(value) => updateForm("tax", value)} label={t("articles.fields.vat")} customLabel={t("articles.tax.custom")} />
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm font-medium text-[#334155] outline-none focus:ring-2 focus:ring-slate-900" rows={5} placeholder={t("articles.fields.description")} />
        </StandardModal>
      )}
    </div>
  )
}
