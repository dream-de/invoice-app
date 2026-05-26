"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type Mode = "login" | "setup"

type SubmitState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

function getError(result: unknown, fallback: string) {
  if (typeof result === "object" && result !== null && "error" in result && typeof result.error === "string") {
    return result.error
  }

  return fallback
}

export function LoginClient({ setupAvailable }: { setupAvailable: boolean }) {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>(setupAvailable ? "setup" : "login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch(mode === "setup" ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "Anmeldung konnte nicht verarbeitet werden.") })
        return
      }

      const nextPath = new URL(window.location.href).searchParams.get("next")
      const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"

      setState({ type: "success", message: mode === "setup" ? "Owner wurde angelegt." : "Anmeldung erfolgreich." })
      router.push(safeNextPath)
      router.refresh()
    } catch {
      setState({ type: "error", message: "Anmeldung konnte nicht verarbeitet werden." })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6f9] px-6 py-10 text-[#1d2433]">
      <section className="mx-auto max-w-md rounded-[32px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Dream Invoice</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
          {mode === "setup" ? "Initialen Owner anlegen" : "Anmelden"}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#64748b]">
          {mode === "setup"
            ? "Lege den ersten lokalen Owner an. Danach wird das Setup automatisch geschlossen."
            : "Melde dich mit einem aktiven App-Benutzer an."}
        </p>

        {setupAvailable ? (
          <div className="mt-5 grid grid-cols-2 rounded-full bg-[#eef2f7] p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("setup")}
              className={`rounded-full px-4 py-2 ${mode === "setup" ? "bg-white text-[#111827] shadow-sm" : "text-[#64748b]"}`}
            >
              Setup
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 ${mode === "login" ? "bg-white text-[#111827] shadow-sm" : "text-[#64748b]"}`}
            >
              Login
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {mode === "setup" ? (
            <label className="block text-sm font-semibold text-[#111827]">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder="Owner Name"
              />
            </label>
          ) : null}

          <label className="block text-sm font-semibold text-[#111827]">
            E-Mail
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
              placeholder="owner@example.test"
            />
          </label>

          <label className="block text-sm font-semibold text-[#111827]">
            Passwort
            <input
              required
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
              placeholder="Mindestens 12 Zeichen"
            />
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-12 w-full rounded-full bg-[#111827] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Bitte warten..." : mode === "setup" ? "Owner anlegen" : "Anmelden"}
          </button>
        </form>

        {state.message ? (
          <p className={`mt-4 rounded-[16px] px-4 py-3 text-sm font-semibold ${state.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {state.message}
          </p>
        ) : null}
      </section>
    </main>
  )
}
