"use client"

import { Eye, EyeOff } from "lucide-react"
import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/i18n"

type Mode = "login" | "setup"
type LoginStep = "credentials" | "two_factor"

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

export function LoginClient({
  setupAvailable,
  demoMode = false
}: {
  setupAvailable: boolean
  demoMode?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()
  const [mode, setMode] = useState<Mode>(setupAvailable ? "setup" : "login")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [challengeToken, setChallengeToken] = useState("")
  const [loginStep, setLoginStep] = useState<LoginStep>("credentials")
  const [showPassword, setShowPassword] = useState(false)
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsSubmitting(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch(loginStep === "two_factor" ? "/api/auth/2fa/verify" : mode === "setup" ? "/api/auth/setup" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginStep === "two_factor" ? { challengeToken, code: twoFactorCode } : { name, email, password })
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, t("login.error.generic")) })
        return
      }

      if (result.requiresTwoFactor && typeof result.challengeToken === "string") {
        setChallengeToken(result.challengeToken)
        setLoginStep("two_factor")
        setState({ type: "idle", message: "" })
        return
      }

      if (result.verificationRequired) {
        setState({ type: "success", message: "Bitte pruefe dein E-Mail-Postfach und bestaetige die Registrierung. Danach kannst du dich anmelden." })
        setMode("login")
        setPassword("")
        return
      }

      const nextPath = new URL(window.location.href).searchParams.get("next")
      const safeNextPath = nextPath?.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/dashboard"

      setState({ type: "success", message: mode === "setup" ? t("login.success.setup") : t("login.success.login") })
      router.push(safeNextPath)
      router.refresh()
    } catch {
      setState({ type: "error", message: t("login.error.generic") })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f6f9] px-6 py-10 text-[#1d2433]">
      <section className="mx-auto max-w-md rounded-[32px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Dream Invoice</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827]">
          {mode === "setup" ? t("login.title.setup") : t("login.title.login")}
        </h1>
        <p className="mt-3 text-sm font-medium leading-6 text-[#64748b]">
          {loginStep === "two_factor" ? "Gib den Sicherheitscode aus deiner Authenticator-App oder einen Backup-Code ein." : demoMode ? "Melde dich mit einem aktiven Demo-Benutzer an." : mode === "setup" ? t("login.description.setup") : t("login.description.login")}
        </p>

        {searchParams?.get("verified") === "1" ? (
          <p className="mt-4 rounded-[16px] bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
            E-Mail bestaetigt. Du kannst dich jetzt anmelden.
          </p>
        ) : null}

        {setupAvailable && loginStep === "credentials" ? (
          <div className="mt-5 grid grid-cols-2 rounded-full bg-[#eef2f7] p-1 text-sm font-semibold">
            <button
              type="button"
              onClick={() => setMode("setup")}
              className={`rounded-full px-4 py-2 ${mode === "setup" ? "bg-white text-[#111827] shadow-sm" : "text-[#64748b]"}`}
            >
              {t("login.mode.setup")}
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`rounded-full px-4 py-2 ${mode === "login" ? "bg-white text-[#111827] shadow-sm" : "text-[#64748b]"}`}
            >
              {t("login.mode.login")}
            </button>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {loginStep === "two_factor" ? (
            <label className="block text-sm font-semibold text-[#111827]">
              Sicherheitscode
              <input
                required
                value={twoFactorCode}
                onChange={(event) => setTwoFactorCode(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder="123456"
              />
            </label>
          ) : mode === "setup" ? (
            <label className="block text-sm font-semibold text-[#111827]">
              {t("login.field.name")}
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder={t("login.placeholder.name")}
              />
            </label>
          ) : null}

          {loginStep === "credentials" ? <label className="block text-sm font-semibold text-[#111827]">
            {demoMode ? "E-Mail / Benutzername" : t("login.field.email")}
            <input
              required
              type={demoMode ? "text" : "email"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
              placeholder={t("login.placeholder.email")}
            />
          </label> : null}

          {loginStep === "credentials" ? <label className="block text-sm font-semibold text-[#111827]">
            {t("login.field.password")}
            <span className="relative mt-2 block">
              <input
                required
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 pr-12 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder={t("login.placeholder.password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((value) => !value)}
                className="absolute right-3 top-1/2 inline-flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-[#64748b] transition hover:bg-[#e2e8f0] hover:text-[#111827]"
                aria-label={showPassword ? t("login.password.hide") : t("login.password.show")}
                title={showPassword ? t("login.password.hide") : t("login.password.show")}
              >
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </span>
            {!demoMode ? (
              <span className="mt-2 block text-xs font-medium leading-5 text-[#64748b]">
                {t("login.password.hint")}
              </span>
            ) : null}
          </label> : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="min-h-11 rounded-full bg-[#111827] px-6 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(15,23,42,0.16)] transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t("login.submitting") : loginStep === "two_factor" ? "Code pruefen" : mode === "setup" ? t("login.submit.setup") : t("login.submit.login")}
          </button>
          {loginStep === "two_factor" ? (
            <button
              type="button"
              onClick={() => {
                setLoginStep("credentials")
                setChallengeToken("")
                setTwoFactorCode("")
              }}
              className="ml-3 min-h-11 rounded-full border border-[#dbe3ec] bg-white px-6 text-sm font-semibold text-[#111827] transition hover:bg-[#f8fafc]"
            >
              Zurueck
            </button>
          ) : null}
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
