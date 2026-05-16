"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type SubmitState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

export function LicenseActivationForm() {
  const router = useRouter()
  const [licenseKey, setLicenseKey] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedKey = licenseKey.trim()

    if (!trimmedKey) {
      setState({ type: "error", message: "Bitte Lizenzschluessel eintragen." })
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
          message: result.error ?? "Lizenz konnte nicht aktiviert werden."
        })
        return
      }

      setLicenseKey("")
      setState({
        type: "success",
        message: `Lizenz aktiviert: ${result.license.plan} / ${result.license.maxUsers ?? "unlimitiert"} Benutzer`
      })
      router.refresh()
    } catch {
      setState({
        type: "error",
        message: "Lizenzserver konnte nicht erreicht werden."
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-5 rounded-[22px] border border-[#e5eaf0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <label htmlFor="license-key" className="text-sm font-semibold text-[#111827]">
        Lizenzschluessel aktivieren
      </label>

      <textarea
        id="license-key"
        value={licenseKey}
        onChange={(event) => setLicenseKey(event.target.value)}
        rows={4}
        className="mt-3 w-full resize-none rounded-[18px] border border-[#dbe3ec] bg-[#f8fafc] px-4 py-3 text-sm font-medium text-[#111827] outline-none transition focus:border-[#94a3b8] focus:bg-white focus:ring-4 focus:ring-[#dbeafe]"
        placeholder="INV1..."
        spellCheck={false}
      />

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-medium leading-5 text-[#64748b]">
          Der Schluessel wird serverseitig geprueft. Plan und Benutzerlimit koennen nicht im Browser gesetzt werden.
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex shrink-0 items-center justify-center rounded-full bg-[#111827] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Pruefe..." : "Aktivieren"}
        </button>
      </div>

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
