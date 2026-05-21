"use client"

import {
  AlertCircle,
  Check,
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
import { useEffect, useMemo, useState } from "react"
import { Input } from "@invoice-platform/ui"
import { useLanguage } from "@/lib/i18n"

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
  const [items, setItems] = useState<ArticleItem[]>([])
  const [loading, setLoading] = useState(true)
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

  async function loadArticles() {
    setLoading(true)
    const response = await fetch("/api/articles/list", { cache: "no-store" })
    const result = await response.json()

    if (result.ok) {
      setItems(result.articles)
    }

    setLoading(false)
  }

  useEffect(() => {
    loadArticles()
  }, [])

  const categories = [
    "Alle",
    ...Array.from(new Set(items.map((article) => article.category || "Sonstiges")))
  ]

  const categoryLabel = (value: string) => {
    if (value === "Alle") return t("articles.filters.all")
    if (value === "Sonstiges") return t("articles.fallback.category")
    return value
  }

  const filtered = useMemo(() => {
    const search = query.toLowerCase()

    return items.filter((article) => {
      const text = [
        article.name,
        article.code,
        article.category,
        article.unit
      ].join(" ").toLowerCase()

      const matchesQuery = text.includes(search)
      const matchesCategory = category === "Alle" || (article.category || "Sonstiges") === category

      return matchesQuery && matchesCategory
    })
  }, [items, query, category])

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
    await loadArticles()
  }

  function openEdit(article: ArticleItem) {
    setEditingArticle(article)
    setEditForm(articleToForm(article))
    setEditOpen(true)
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
    await loadArticles()
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

    await loadArticles()
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
      await loadArticles()
    } catch (error) {
      setImportError(error instanceof Error ? error.message : t("articles.messages.importFailed"))
    } finally {
      setImportLoading(false)
    }
  }

  function ArticleActions({ article }: { article: ArticleItem }) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={() => openEdit(article)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef2f7] text-[#475569] hover:bg-[#e3e8ef]"
          aria-label={t("articles.actions.editArticle")}
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          onClick={() => deleteArticle(article)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
          aria-label={t("articles.actions.deleteArticle")}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-[1480px]">
      <section className="rounded-[34px] border border-[#e3e9f1] bg-[#f8f9fb] p-7 shadow-[0_8px_26px_rgba(15,23,42,0.05)]">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h1 className="max-w-[520px] text-[34px] font-semibold leading-[1.12] tracking-tight text-[#111827]">
              {t("articles.overview.title")}
            </h1>
            <p className="mt-3 text-base font-medium text-[#64748b]">
              {loading ? t("articles.overview.loading") : t("articles.overview.entries").replace("{count}", String(items.length))}
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

        {view === "grid" ? (
          <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {filtered.map((article) => {
              const price = taxMode === "gross" ? Number(article.price ?? 0) * (1 + Number(article.tax ?? 19) / 100) : Number(article.price ?? 0)

              return (
                <article key={article.id} className="rounded-[30px] border border-[#e5eaf0] bg-white p-6 shadow-sm transition hover:border-[#cfd8e5] hover:shadow-md">
                  <div className="mb-5 flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-base font-semibold text-emerald-600 ring-1 ring-emerald-100">
                      {(article.name || "AR").slice(0, 2).toUpperCase()}
                    </div>
                    <ArticleActions article={article} />
                  </div>

                  <span className="inline-flex rounded-full bg-[#eef2f7] px-3 py-1 text-xs font-medium uppercase text-[#64748b]">
                    {categoryLabel(article.category || "Sonstiges")}
                  </span>

                  <h2 className="mt-3 text-lg font-semibold tracking-tight text-[#111827]">{article.name}</h2>
                  <p className="mt-2 text-sm font-semibold text-[#94a3b8]">#{article.code || t("articles.fallback.code")}</p>

                  <div className="mt-7 border-t border-[#edf2f7] pt-5">
                    <p className="text-xs font-medium uppercase tracking-widest text-[#94a3b8]">{t("articles.price.label").replace("{mode}", taxMode === "net" ? t("articles.tax.net") : t("articles.tax.gross"))}</p>
                    <div className="mt-2 flex items-end justify-between gap-4">
                      <p className="text-[30px] font-semibold leading-none tracking-tight text-[#111827]">{formatPrice(price, language)} €</p>
                      <p className="pb-1 text-sm font-medium text-[#64748b]">/ {article.unit || t("articles.units.pieceShort")}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        ) : (
          <div className="mt-8 space-y-3">
            {filtered.map((article) => {
              const price = taxMode === "gross" ? Number(article.price ?? 0) * (1 + Number(article.tax ?? 19) / 100) : Number(article.price ?? 0)

              return (
                <article key={article.id} className="grid gap-4 rounded-[26px] border border-[#e5eaf0] bg-white px-5 py-4 shadow-sm md:grid-cols-[1.4fr_0.65fr_0.65fr_0.75fr_auto] md:items-center">
                  <div>
                    <p className="font-semibold text-[#111827]">{article.name}</p>
                    <p className="mt-1 text-sm font-medium text-[#64748b]">#{article.code || t("articles.fallback.code")} · {categoryLabel(article.category || "Sonstiges")}</p>
                  </div>
                  <div className="text-sm font-semibold text-[#475569]">{article.tax ?? "19"}% {t("articles.tax.vatShort")}</div>
                  <div className="text-sm font-semibold text-[#475569]">{article.unit || t("articles.units.pieceShort")}</div>
                  <div className="text-right text-xl font-semibold text-[#111827]">{formatPrice(price, language)} €</div>
                  <ArticleActions article={article} />
                </article>
              )
            })}
          </div>
        )}
      </section>

      {editOpen && editingArticle && (
        <div className="fixed inset-0 z-[135] flex justify-end bg-black/20 px-4 py-7">
          <div className="flex h-[calc(100vh-56px)] w-full max-w-[380px] flex-col overflow-hidden rounded-[38px] bg-white shadow-[-18px_0_45px_rgba(15,23,42,0.18)]">
            <div className="flex items-start justify-between gap-4 border-b border-[#edf2f7] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold tracking-tight text-[#111827]">{t("articles.edit.title")}</h2>
                <p className="mt-1 text-sm font-semibold text-[#94a3b8]">
                  {editingArticle.code || editingArticle.name}
                </p>
              </div>

              <button
                onClick={() => setEditOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]"
                aria-label={t("articles.actions.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-auto px-6 py-5">
              <div className="grid grid-cols-[1fr_0.78fr] gap-3">
                <Input placeholder={t("articles.fields.nameRequired")} value={editForm.name} onChange={(event) => updateEditForm("name", event.target.value)} />
                <Input placeholder={t("articles.fields.code")} value={editForm.code} onChange={(event) => updateEditForm("code", event.target.value)} />
              </div>

              <Input placeholder={t("articles.fields.category")} value={editForm.category} onChange={(event) => updateEditForm("category", event.target.value)} />

              <div className="border-t border-[#edf2f7] pt-5">
                <h3 className="mb-4 text-sm font-semibold text-[#111827]">{t("articles.edit.pricesTaxes")}</h3>

                <div className="grid grid-cols-[1fr_0.78fr] gap-3">
                  <Input placeholder={t("articles.fields.netPriceRequired")} value={editForm.price} onChange={(event) => updateEditForm("price", event.target.value)} />
                  <Input placeholder={t("articles.fields.unit")} value={editForm.unit} onChange={(event) => updateEditForm("unit", event.target.value)} />
                </div>

                <div className="mt-4">
                  <TaxRateControl value={editForm.tax} onChange={(value) => updateEditForm("tax", value)} label={t("articles.fields.vat")} customLabel={t("articles.tax.custom")} />
                </div>
              </div>

              <div className="border-t border-[#edf2f7] pt-5">
                <textarea
                  value={editForm.description}
                  onChange={(event) => updateEditForm("description", event.target.value)}
                  className="w-full rounded-[22px] border border-[#dfe6ee] bg-[#f7f9fc] px-4 py-3 text-sm font-medium text-[#334155] outline-none focus:ring-2 focus:ring-slate-900"
                  rows={5}
                  placeholder={t("articles.fields.description")}
                />
                <p className="mt-2 text-xs font-medium text-[#94a3b8]">
                  {t("articles.edit.invoiceHint")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[#edf2f7] bg-white px-6 py-4">
              <button
                onClick={() => deleteArticle(editingArticle)}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 hover:bg-red-100"
                aria-label={t("articles.actions.deleteArticle")}
              >
                <Trash2 className="h-5 w-5" />
              </button>

              <button
                onClick={updateArticle}
                className="inline-flex h-12 items-center gap-2 rounded-full bg-black px-7 text-sm font-semibold text-[var(--brand-lime)] shadow-sm"
              >
                <Check className="h-4 w-4" />
                {t("articles.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 px-4">
          <div className="w-full max-w-5xl rounded-[30px] bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-[#111827]">{t("articles.import.title")}</h2>
                <p className="mt-1 text-sm font-medium text-[#64748b]">{t("articles.import.description")}</p>
              </div>
              <button onClick={() => { setImportOpen(false); setImportError("") }} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]" aria-label={t("articles.actions.close")}>
                <X className="h-5 w-5" />
              </button>
            </div>

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
          </div>
        </div>
      )}

      {panelOpen && (
        <div className="fixed inset-0 z-[120] flex justify-end bg-black/35">
          <div className="h-full w-full max-w-[430px] border-l border-[#dfe6ee] bg-[#f8f9fb] shadow-[-10px_0_35px_rgba(0,0,0,0.16)]">
            <div className="flex items-start justify-between border-b border-[#e6ebf1] px-6 py-5">
              <div>
                <h2 className="text-xl font-semibold text-[#1b2333]">{t("articles.createPanel.title")}</h2>
                <p className="mt-1 text-sm font-medium text-[#7b8799]">{t("articles.createPanel.description")}</p>
              </div>
              <button onClick={() => setPanelOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full bg-[#edf1f6] text-slate-700 hover:bg-[#e4eaf2]" aria-label={t("articles.actions.close")}>
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="h-[calc(100%-148px)] space-y-4 overflow-auto px-6 py-5">
              <Input placeholder={t("articles.fields.nameRequired")} value={form.name} onChange={(event) => updateForm("name", event.target.value)} />
              <Input placeholder={t("articles.fields.code")} value={form.code} onChange={(event) => updateForm("code", event.target.value)} />
              <Input placeholder={t("articles.fields.category")} value={form.category} onChange={(event) => updateForm("category", event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder={t("articles.fields.netPriceRequired")} value={form.price} onChange={(event) => updateForm("price", event.target.value)} />
                <Input placeholder={t("articles.fields.unit")} value={form.unit} onChange={(event) => updateForm("unit", event.target.value)} />
              </div>
              <TaxRateControl value={form.tax} onChange={(value) => updateForm("tax", value)} label={t("articles.fields.vat")} customLabel={t("articles.tax.custom")} />
              <textarea value={form.description} onChange={(event) => updateForm("description", event.target.value)} className="w-full rounded-[18px] border border-[#dfe6ee] bg-[#eef2f7] px-4 py-3 text-sm font-medium text-[#334155] outline-none focus:ring-2 focus:ring-slate-900" rows={5} placeholder={t("articles.fields.description")} />
            </div>

            <div className="h-[88px] border-t border-[#e6ebf1] px-6 py-4">
              <button onClick={createArticle} className="w-full rounded-full bg-black px-5 py-3 font-semibold text-[var(--brand-lime)]">
                {t("articles.actions.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
