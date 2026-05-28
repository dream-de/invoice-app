"use client"

import { KeyRound, MailCheck, ShieldCheck, UserRound } from "lucide-react"
import { useState } from "react"

type Profile = {
  name: string | null
  email: string
  role: string
  status: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  lastLoginAt: string | null
}

type State = { type: "idle" | "success" | "error"; message: string }

function getError(result: unknown, fallback: string) {
  if (typeof result === "object" && result !== null && "error" in result && typeof result.error === "string") return result.error
  return fallback
}

export function AccountSecurityClient({ initialProfile }: { initialProfile: Profile }) {
  const [profile, setProfile] = useState(initialProfile)
  const [name, setName] = useState(initialProfile.name ?? "")
  const [email, setEmail] = useState(initialProfile.email)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "", confirmPassword: "" })
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [twoFactorSetup, setTwoFactorSetup] = useState<{ secret: string; otpAuthUri: string; qrCodeDataUrl: string } | null>(null)
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [state, setState] = useState<State>({ type: "idle", message: "" })
  const [busy, setBusy] = useState(false)

  async function refreshProfile() {
    const response = await fetch("/api/account/profile", { cache: "no-store" })
    const result = await response.json()
    if (response.ok && result.ok) {
      setProfile(result.user)
      setName(result.user.name ?? "")
      setEmail(result.user.email)
    }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email })
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "Profil konnte nicht gespeichert werden.") })
        return
      }
      setProfile(result.user)
      setState({ type: "success", message: "Profil wurde gespeichert." })
    } finally {
      setBusy(false)
    }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "Passwort konnte nicht geaendert werden.") })
        return
      }
      setPasswordForm({ currentPassword: "", nextPassword: "", confirmPassword: "" })
      setState({ type: "success", message: "Passwort wurde geaendert." })
    } finally {
      setBusy(false)
    }
  }

  async function startTwoFactor() {
    setBusy(true)
    setState({ type: "idle", message: "" })
    try {
      const response = await fetch("/api/account/2fa/setup", { method: "POST" })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "2FA konnte nicht vorbereitet werden.") })
        return
      }
      setTwoFactorSetup({ secret: result.secret, otpAuthUri: result.otpAuthUri, qrCodeDataUrl: result.qrCodeDataUrl })
    } finally {
      setBusy(false)
    }
  }

  async function confirmTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setState({ type: "idle", message: "" })
    try {
      const response = await fetch("/api/account/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode })
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "2FA konnte nicht aktiviert werden.") })
        return
      }
      setBackupCodes(result.backupCodes ?? [])
      setTwoFactorSetup(null)
      setTwoFactorCode("")
      setState({ type: "success", message: "2FA wurde aktiviert. Sichere deine Backup-Codes." })
      await refreshProfile()
    } finally {
      setBusy(false)
    }
  }

  async function disableTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setState({ type: "idle", message: "" })
    try {
      const response = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword })
      })
      const result = await response.json()
      if (!response.ok || !result.ok) {
        setState({ type: "error", message: getError(result, "2FA konnte nicht deaktiviert werden.") })
        return
      }
      setDisablePassword("")
      setBackupCodes([])
      setState({ type: "success", message: "2FA wurde deaktiviert." })
      await refreshProfile()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-[#e5eaf0] bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Mein Konto</p>
        <h1 className="mt-3 text-3xl font-semibold text-[#111827]">Profil & Sicherheit</h1>
        <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-[#64748b]">
          Verwalte deine eigenen Kontodaten, dein Passwort und die Zwei-Faktor-Authentifizierung.
        </p>
      </section>

      {state.message ? (
        <p className={`rounded-[16px] px-4 py-3 text-sm font-semibold ${state.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-2">
        <form onSubmit={submitProfile} className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <UserRound className="h-5 w-5 text-[#64748b]" />
            <h2 className="text-lg font-semibold text-[#111827]">Persoenliche Daten</h2>
          </div>
          <div className="mt-5 space-y-4">
            <label className="block text-sm font-semibold text-[#111827]">
              Name
              <input value={name} onChange={(event) => setName(event.target.value)} className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white" />
            </label>
            <label className="block text-sm font-semibold text-[#111827]">
              E-Mail
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white" />
            </label>
            <p className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
              <MailCheck className="h-4 w-4" />
              {profile.emailVerified ? "E-Mail bestaetigt" : "E-Mail nicht bestaetigt"}
            </p>
            <button disabled={busy} className="min-h-11 rounded-full bg-[#111827] px-5 text-sm font-semibold text-white disabled:opacity-60">Speichern</button>
          </div>
        </form>

        <form onSubmit={submitPassword} className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <KeyRound className="h-5 w-5 text-[#64748b]" />
            <h2 className="text-lg font-semibold text-[#111827]">Passwort aendern</h2>
          </div>
          <div className="mt-5 space-y-4">
            {(["currentPassword", "nextPassword", "confirmPassword"] as const).map((key) => (
              <input
                key={key}
                type="password"
                value={passwordForm[key]}
                onChange={(event) => setPasswordForm((current) => ({ ...current, [key]: event.target.value }))}
                placeholder={key === "currentPassword" ? "Aktuelles Passwort" : key === "nextPassword" ? "Neues Passwort" : "Neues Passwort bestaetigen"}
                className="min-h-12 w-full rounded-[16px] border border-[#dbe3ec] bg-[#f8fafc] px-4 text-sm font-medium outline-none focus:border-[#94a3b8] focus:bg-white"
              />
            ))}
            <button disabled={busy} className="min-h-11 rounded-full bg-[#111827] px-5 text-sm font-semibold text-white disabled:opacity-60">Passwort speichern</button>
          </div>
        </form>
      </div>

      <section className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[#64748b]" />
            <div>
              <h2 className="text-lg font-semibold text-[#111827]">Zwei-Faktor-Authentifizierung</h2>
              <p className="mt-1 text-sm font-medium text-[#64748b]">{profile.twoFactorEnabled ? "Aktiv" : "Nicht aktiv"}</p>
            </div>
          </div>
          {!profile.twoFactorEnabled ? (
            <button type="button" disabled={busy} onClick={startTwoFactor} className="min-h-11 rounded-full bg-[#111827] px-5 text-sm font-semibold text-white disabled:opacity-60">2FA aktivieren</button>
          ) : null}
        </div>

        {twoFactorSetup ? (
          <form onSubmit={confirmTwoFactor} className="mt-5 rounded-[22px] border border-[#dbe3ec] bg-[#f8fafc] p-4 sm:p-5">
            <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
              <div className="rounded-[22px] border border-[#e5eaf0] bg-white p-4 text-center shadow-sm">
                <div className="mx-auto flex h-[196px] w-[196px] items-center justify-center rounded-[18px] border border-[#edf2f7] bg-white p-3">
                  {twoFactorSetup.qrCodeDataUrl ? (
                    <img src={twoFactorSetup.qrCodeDataUrl} alt="2FA QR-Code" className="h-full w-full" />
                  ) : (
                    <span className="text-xs font-semibold text-[#64748b]">QR-Code wird erstellt</span>
                  )}
                </div>
                <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-[#94a3b8]">Authenticator scannen</p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-black text-[#111827]">QR-Code mit deiner Authenticator-App scannen</p>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#64748b]">
                  Danach zeigt dein Handy einen 6-stelligen Code. Gib diesen Code hier ein, um die Zwei-Faktor-Authentifizierung zu aktivieren.
                </p>

                <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <input
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    placeholder="000000"
                    className="min-h-12 w-full max-w-[190px] rounded-[16px] border border-[#dbe3ec] bg-white px-4 text-center text-xl font-black tracking-[0.22em] text-[#111827] outline-none focus:border-[#94a3b8]"
                  />
                  <button disabled={busy} className="min-h-11 rounded-full bg-[#111827] px-5 text-sm font-semibold text-white disabled:opacity-60">
                    2FA-Code pruefen
                  </button>
                </div>

                <details className="mt-5 rounded-[16px] border border-[#e5eaf0] bg-white px-4 py-3">
                  <summary className="cursor-pointer text-sm font-black text-[#111827]">Manuell einrichten</summary>
                  <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">Secret</p>
                  <p className="mt-2 break-all rounded-[14px] bg-[#f8fafc] px-3 py-2 font-mono text-sm text-[#111827]">{twoFactorSetup.secret}</p>
                  <p className="mt-2 break-all text-xs font-medium text-[#64748b]">{twoFactorSetup.otpAuthUri}</p>
                </details>
              </div>
            </div>
          </form>
        ) : null}

        {backupCodes.length ? (
          <div className="mt-5 rounded-[18px] border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-black text-amber-800">Backup-Codes nur jetzt sichern</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {backupCodes.map((code) => <code key={code} className="rounded-[12px] bg-white px-3 py-2 text-sm font-black text-[#111827]">{code}</code>)}
            </div>
          </div>
        ) : null}

        {profile.twoFactorEnabled ? (
          <form onSubmit={disableTwoFactor} className="mt-5 flex flex-col gap-3 rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4 sm:flex-row">
            <input type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} placeholder="Passwort zum Deaktivieren" className="min-h-12 flex-1 rounded-[16px] border border-[#dbe3ec] bg-white px-4 text-sm font-medium outline-none focus:border-[#94a3b8]" />
            <button disabled={busy} className="min-h-12 rounded-full border border-red-100 bg-red-50 px-5 text-sm font-semibold text-red-700 disabled:opacity-60">2FA deaktivieren</button>
          </form>
        ) : null}
      </section>
    </div>
  )
}
