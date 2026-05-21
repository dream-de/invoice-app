"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@invoice-platform/ui"
import { useLanguage } from "@/lib/i18n"

export default function NewDocumentPage() {
  const router = useRouter()
  const { t } = useLanguage()
  const [status, setStatus] = useState<"creating" | "error">("creating")
  const [message, setMessage] = useState(t("documents.new.creating"))

  async function createDraft() {
    setStatus("creating")
    setMessage(t("documents.new.creating"))

    try {
      const todayDate = new Date()
      const today = todayDate.toISOString().slice(0, 10)
      const dueDateValue = new Date(todayDate)
      dueDateValue.setDate(dueDateValue.getDate() + 14)
      const dueDate = dueDateValue.toISOString().slice(0, 10)

      const response = await fetch("/api/invoice/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          date: today,
          dueDate,
          taxRate: 0.19,
          tip: 0,
          note: t("documents.new.defaultNote"),
          items: [
            {
              name: t("documents.new.defaultItem"),
              quantity: 1,
              price: 0,
              total: 0
            }
          ]
        })
      })

      const result = await response.json()

      if (!response.ok || !result?.invoice?.id) {
        throw new Error(result?.error || t("documents.new.errors.createDraft"))
      }

      router.replace(`/documents/${result.invoice.id}/edit`)
    } catch (error) {
      setStatus("error")
      setMessage(error instanceof Error ? error.message : t("documents.new.errors.unknown"))
    }
  }

  useEffect(() => {
    createDraft()
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-10 text-[#111827]">
      <div className="mx-auto max-w-xl rounded-[28px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <Link href="/documents" className="text-sm font-bold uppercase tracking-widest text-slate-400 no-underline hover:text-slate-900">
          {t("documents.new.back")}
        </Link>

        <h1 className="mt-6 text-3xl font-extrabold tracking-tight">
          {t("documents.new.title")}
        </h1>

        <p className="mt-3 text-sm font-medium leading-6 text-slate-500">
          {message}
        </p>

        {status === "creating" ? (
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full w-1/2 animate-pulse rounded-full bg-[var(--brand-lime)]" />
          </div>
        ) : (
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={createDraft}>{t("documents.new.retry")}</Button>
            <Link href="/documents" className="inline-flex min-h-11 items-center rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-700 no-underline">
              {t("documents.new.cancel")}
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
