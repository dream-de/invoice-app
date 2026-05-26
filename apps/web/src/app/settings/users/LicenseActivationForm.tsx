"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/i18n"

type SubmitState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

export function LicenseActivationForm() {
  const router = useRouter()
  const { t } = useLanguage()
  const [licenseKey, setLicenseKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })

  async function handleLicenseFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await file.text()
      setLicenseKey(content.trim())
      setState({
        type: "success",
        message: t("settings.users.license.form.fileLoaded").replace("{name}", file.name)
      })
    } catch {
      setState({ type: "error", message: t("settings.users.license.form.fileError") })
    } finally {
      event.target.value = ""
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedKey = licenseKey.trim()

    if (!trimmedKey) {
      setState({ type: "error", message: t("settings.users.license.form.emptyError") })
      return
    }

    setIsSubmitting(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/license/activate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ licenseKey: trimmedKey })
      })

      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({
          type: "error",
          message: result.error ?? t("settings.users.license.form.activateError")
        })
        return
      }

      setLicenseKey("")
      setState({
        type: "success",
        message: t("settings.users.license.form.activated").replace("{plan}", result.license.plan).replace("{users}", String(result.license.maxUsers ?? t("settings.users.planUsers.unlimited")))
      })
      router.refresh()
    } catch {
      setState({
        type: "error",
        message: t("settings.users.license.form.serverError")
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[24px] border border-[#e5eaf0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <label htmlFor="license-key" className="flex-1 text-sm font-semibold text-[#111827]">
          {t("settings.users.license.form.label")}
          <textarea
            id="license-key"
            value={licenseKey}
            onChange={(event) => setLicenseKey(event.target.value)}
            rows={2}
            className="mt-2 w-full resize-none rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-2.5 text-sm font-medium text-[#111827] outline-none transition focus:border-[#94a3b8] focus:bg-white focus:ring-4 focus:ring-[#dbeafe]"
            placeholder="INV1..."
            spellCheck={false}
          />
        </label>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-full bg-[#111827] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? t("settings.users.license.form.checking") : t("settings.users.license.form.activate")}
        </button>
      </div>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium leading-5 text-[#64748b]">
          {t("settings.users.license.form.hint")}
        </p>

        <label className="inline-flex cursor-pointer items-center justify-center rounded-full border border-[#dbe3ec] bg-[#f8fafc] px-4 py-2 text-xs font-black text-[#111827] transition hover:bg-white">
          {t("settings.users.license.form.upload")}
          <input
            type="file"
            accept=".lic,.license,.txt,.json,application/json,text/plain"
            onChange={handleLicenseFile}
            className="sr-only"
          />
        </label>
      </div>

      <p className="mt-2 text-[11px] font-medium text-[#94a3b8]">{t("settings.users.license.form.uploadHint")}</p>

      {state.message ? (
        <p
          className={`mt-3 rounded-[16px] px-4 py-3 text-sm font-semibold ${
            state.type === "success"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  )
}
