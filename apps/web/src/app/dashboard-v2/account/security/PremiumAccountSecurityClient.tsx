"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Activity,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Copy,
  Eye,
  EyeOff,
  Fingerprint,
  Globe,
  KeyRound,
  Laptop,
  LockKeyhole,
  LogOut,
  Mail,
  Monitor,
  QrCode,
  ShieldCheck,
  UserRound,
  XCircle
} from "lucide-react"
import styles from "./PremiumAccountSecurityClient.module.css"

type InitialProfile = {
  name: string | null
  email: string
  role: string
  status: string
  emailVerified: boolean
  twoFactorEnabled: boolean
  lastLoginAt: string | null
}

type MessageState = { kind: "idle" | "success" | "error"; text: string }

type TwoFactorSetup = {
  secret: string
  otpAuthUri: string
  qrCodeDataUrl: string
}

type AuditEntry = {
  id: string
  action: string
  entity: string
  entityId: string | null
  reason: string | null
  createdAt: string
  ipAddress?: string | null
  publicIp?: string | null
  privateIp?: string | null
  accessHost?: string | null
  accessProtocol?: string | null
  accessOrigin?: string | null
  operatingSystem?: string | null
  deviceType?: string | null
  country?: string | null
  region?: string | null
  city?: string | null
  geoProvider?: string | null
  ip?: string | null
  browser?: string | null
  os?: string | null
  location?: string | null
  userAgent?: string | null
}

function readError(result: unknown, fallback: string) {
  if (typeof result === "object" && result && "error" in result && typeof (result as { error?: unknown }).error === "string") {
    return (result as { error: string }).error
  }
  return fallback
}

function statusLabel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized === "active") return "Aktiv"
  if (normalized === "inactive") return "Inaktiv"
  if (normalized === "invited") return "Eingeladen"
  return value
}

function roleLabel(value: string) {
  const normalized = value.toLowerCase()
  if (normalized === "admin" || normalized === "administrator") return "Administrator"
  if (normalized === "owner") return "Owner"
  if (normalized === "user") return "Mitarbeiter"
  return value
}

function formatDateTime(value: string | null) {
  if (!value) return "Nicht verfügbar"
  try {
    return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value))
  } catch {
    return value
  }
}

function splitDisplayName(value: string | null | undefined) {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return { firstName: "", lastName: "" }
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length === 1) return { firstName: parts[0], lastName: "" }
  return { firstName: parts.shift() ?? "", lastName: parts.join(" ") }
}

function browserLabelFromUserAgent(userAgent: string) {
  if (!userAgent) return "Nicht verfügbar"
  const patterns = [
    [/Edg\/(\d+)/, "Edge"],
    [/Chrome\/(\d+)/, "Chrome"],
    [/Firefox\/(\d+)/, "Firefox"],
    [/Safari\/(\d+)/, "Safari"]
  ] as const
  for (const [pattern, label] of patterns) {
    const match = userAgent.match(pattern)
    if (match) return label + " " + match[1]
  }
  return "Unbekannter Browser"
}

function osLabelFromUserAgent(userAgent: string) {
  if (!userAgent) return "Nicht verfügbar"
  if (/Windows NT 11/.test(userAgent)) return "Windows 11"
  if (/Windows NT 10/.test(userAgent)) return "Windows 10"
  if (/Mac OS X/.test(userAgent)) return "macOS"
  if (/Android/.test(userAgent)) return "Android"
  if (/iPhone|iPad|iPod/.test(userAgent)) return "iOS"
  if (/Linux/.test(userAgent)) return "Linux"
  return "Nicht verfügbar"
}

function deviceLabelFromUserAgent(userAgent: string) {
  if (!userAgent) return "Nicht verfügbar"
  return /Mobi|Android|iPhone|iPad|iPod/i.test(userAgent) ? "Mobil" : "Desktop"
}

function auditTitle(action: string) {
  switch (action) {
    case "auth.login_success":
    case "auth.login": return "Anmeldung erfolgreich"
    case "auth.login_failed": return "Anmeldung fehlgeschlagen"
    case "auth.logout": return "Abmeldung"
    case "account.password_changed":
    case "account.password_update": return "Passwort geändert"
    case "account.profile_updated":
    case "account.profile_update": return "Profil aktualisiert"
    case "account.2fa_setup": return "2FA vorbereitet"
    case "account.2fa_enabled":
    case "account.2fa_enable": return "2FA aktiviert"
    case "account.2fa_disabled":
    case "account.2fa_disable": return "2FA deaktiviert"
    case "invoice.sent": return "Rechnung versendet"
    case "invoice.finalize": return "Rechnung freigegeben"
    case "invoice.payment": return "Zahlung erfasst"
    case "expense.create": return "Ausgabe erfasst"
    default: return "Unbekannte Aktivität"
  }
}

function auditReason(reason: string | null) {
  if (!reason) return null
  switch (reason) {
    case "invalid_credentials":
      return "Falsche Anmeldedaten"
    case "missing_credentials":
      return "E-Mail oder Passwort fehlt"
    case "rate_limited":
      return "Zu viele Anmeldeversuche"
    case "session_expired":
      return "Sitzung abgelaufen"
    case "unknown_error":
      return "Unbekannter Fehler"
    default:
      return "Weitere Informationen verfügbar"
  }
}

function auditTone(action: string) {
  switch (action) {
    case "auth.login_success":
    case "auth.login": return "green"
    case "auth.login_failed": return "rose"
    case "auth.logout": return "gray"
    case "account.password_changed":
    case "account.password_update": return "amber"
    case "account.profile_updated":
    case "account.profile_update": return "blue"
    case "account.2fa_setup": return "violet"
    case "account.2fa_enabled":
    case "account.2fa_enable": return "green"
    case "account.2fa_disabled":
    case "account.2fa_disable": return "gray"
    case "invoice.sent": return "violet"
    case "invoice.finalize": return "violet"
    case "invoice.payment": return "green"
    case "expense.create": return "amber"
    default: return "blue"
  }
}

function auditIcon(action: string) {
  switch (action) {
    case "auth.login_success":
    case "auth.login": return CheckCircle2
    case "auth.login_failed": return XCircle
    case "auth.logout": return LogOut
    case "account.password_changed":
    case "account.password_update": return KeyRound
    case "account.profile_updated":
    case "account.profile_update": return UserRound
    case "account.2fa_setup": return ShieldCheck
    case "account.2fa_enabled":
    case "account.2fa_enable": return ShieldCheck
    case "account.2fa_disabled":
    case "account.2fa_disable": return ShieldCheck
    case "invoice.sent": return Mail
    case "invoice.finalize": return Activity
    case "invoice.payment": return CheckCircle2
    case "expense.create": return Activity
    default: return Activity
  }
}

function auditText(entry: AuditEntry) {
  return auditReason(entry.reason)
}

function cleanAuditValue(value: string | null | undefined) {
  const trimmed = value?.trim()
  if (!trimmed || trimmed === "Nicht verfügbar" || trimmed === "Unknown") return null
  return trimmed
}

function auditMetadata(entry: AuditEntry) {
  const accessHost = cleanAuditValue(entry.accessHost ?? entry.accessOrigin)
  const clientIp = cleanAuditValue(entry.privateIp ?? entry.ipAddress)
  const publicIp = cleanAuditValue(entry.publicIp ?? (entry.privateIp ? null : entry.ipAddress))
  const browser = cleanAuditValue(entry.browser) ?? cleanAuditValue(browserLabelFromUserAgent(entry.userAgent ?? ""))
  const os = cleanAuditValue(entry.operatingSystem ?? entry.os) ?? cleanAuditValue(osLabelFromUserAgent(entry.userAgent ?? ""))
  const device = cleanAuditValue(entry.deviceType) ?? cleanAuditValue(deviceLabelFromUserAgent(entry.userAgent ?? ""))

  return {
    accessHost,
    clientIp,
    publicIp,
    browser,
    os,
    device
  }
}

function auditMetaText(entry: AuditEntry) {
  const meta = auditMetadata(entry)
  const parts = [
    meta.accessHost ? `🌐 Zugriff: ${meta.accessHost}` : null,
    meta.clientIp ? `🏠 Client-IP: ${meta.clientIp}` : null,
    meta.publicIp ? `🌍 Öffentliche IP: ${meta.publicIp}` : null,
    meta.browser || meta.os || meta.device
      ? `🖥 ${[meta.browser, meta.os, meta.device].filter((value): value is string => Boolean(value)).join(" · ")}`
      : null
  ].filter((value): value is string => Boolean(value))

  return parts.length ? parts.join(" · ") : "Weitere Informationen verfügbar"
}

function auditDetailText(entry: AuditEntry) {
  const mappedReason = auditText(entry)
  if (mappedReason) return mappedReason
  if (entry.entity || entry.entityId) {
    return [entry.entity, entry.entityId].filter(Boolean).join(" · ")
  }
  return "Weitere Informationen verfügbar"
}

export function PremiumAccountSecurityClient({ initialProfile }: { initialProfile: InitialProfile }) {
  const router = useRouter()
  const [profile, setProfile] = useState(initialProfile)
  const initialName = splitDisplayName(initialProfile.name)
  const [firstName, setFirstName] = useState(initialName.firstName)
  const [lastName, setLastName] = useState(initialName.lastName)
  const [email, setEmail] = useState(initialProfile.email)
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", nextPassword: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState({ current: false, next: false, confirm: false })
  const [twoFactorCode, setTwoFactorCode] = useState("")
  const [disablePassword, setDisablePassword] = useState("")
  const [twoFactorSetup, setTwoFactorSetup] = useState<TwoFactorSetup | null>(null)
  const [auditEntries, setAuditEntries] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(true)
  const [browserLabel, setBrowserLabel] = useState("Nicht verfügbar")
  const [osLabel, setOsLabel] = useState("Nicht verfügbar")
  const [deviceLabel, setDeviceLabel] = useState("Nicht verfügbar")
  const [state, setState] = useState<MessageState>({ kind: "idle", text: "" })
  const [busy, setBusy] = useState<"profile" | "password" | "2fa" | "disable" | "logout" | null>(null)

  useEffect(() => {
    const userAgent = typeof navigator === "undefined" ? "" : navigator.userAgent
    setBrowserLabel(browserLabelFromUserAgent(userAgent))
    setOsLabel(osLabelFromUserAgent(userAgent))
    setDeviceLabel(deviceLabelFromUserAgent(userAgent))
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadAudit() {
      setAuditLoading(true)
      try {
        const response = await fetch("/api/logs/events?limit=6", { cache: "no-store" })
        const result = await response.json().catch(() => null)
        if (!cancelled && response.ok && result?.ok && Array.isArray(result.logs)) {
          setAuditEntries(result.logs)
        } else if (!cancelled) {
          setAuditEntries([])
        }
      } catch {
        if (!cancelled) setAuditEntries([])
      } finally {
        if (!cancelled) setAuditLoading(false)
      }
    }

    void loadAudit()
    return () => { cancelled = true }
  }, [])

  async function refreshProfile() {
    const response = await fetch("/api/account/profile", { cache: "no-store" })
    const result = await response.json().catch(() => null)
    if (response.ok && result?.ok) {
      setProfile(result.user)
      const nextName = splitDisplayName(result.user.name)
      setFirstName(nextName.firstName)
      setLastName(nextName.lastName)
      setEmail(result.user.email)
    }
  }

  async function submitProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("profile")
    setState({ kind: "idle", text: "" })
    try {
      const fullName = [firstName, lastName].filter(Boolean).join(" ").trim()
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email })
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        setState({ kind: "error", text: readError(result, "Profil konnte nicht gespeichert werden.") })
        return
      }
      setProfile(result.user)
      setState({ kind: "success", text: "Profil gespeichert." })
    } finally {
      setBusy(null)
    }
  }

  async function submitPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("password")
    setState({ kind: "idle", text: "" })
    try {
      const response = await fetch("/api/account/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        setState({ kind: "error", text: readError(result, "Passwort konnte nicht geaendert werden.") })
        return
      }
      setPasswordForm({ currentPassword: "", nextPassword: "", confirmPassword: "" })
      setShowPassword({ current: false, next: false, confirm: false })
      setState({ kind: "success", text: "Passwort gespeichert." })
    } finally {
      setBusy(null)
    }
  }

  async function copySecret() {
    if (!twoFactorSetup?.secret) return
    try {
      await navigator.clipboard.writeText(twoFactorSetup.secret)
      setState({ kind: "success", text: "Secret kopiert." })
    } catch {
      setState({ kind: "error", text: "Secret konnte nicht kopiert werden." })
    }
  }

  async function startTwoFactor() {
    setBusy("2fa")
    setState({ kind: "idle", text: "" })
    try {
      const response = await fetch("/api/account/2fa/setup", { method: "POST" })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        setState({ kind: "error", text: readError(result, "2FA konnte nicht vorbereitet werden.") })
        return
      }
      setTwoFactorSetup({ secret: result.secret, otpAuthUri: result.otpAuthUri, qrCodeDataUrl: result.qrCodeDataUrl })
      setState({ kind: "success", text: "2FA vorbereitet." })
    } finally {
      setBusy(null)
    }
  }

  async function activateTwoFactor() {
    setBusy("2fa")
    setState({ kind: "idle", text: "" })
    try {
      const response = await fetch("/api/account/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: twoFactorCode })
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        setState({ kind: "error", text: readError(result, "2FA konnte nicht aktiviert werden.") })
        return
      }
      setTwoFactorCode("")
      setTwoFactorSetup(null)
      setState({ kind: "success", text: "2FA aktiviert." })
      await refreshProfile()
    } finally {
      setBusy(null)
    }
  }

  async function disableTwoFactor(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy("disable")
    setState({ kind: "idle", text: "" })
    try {
      const response = await fetch("/api/account/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword })
      })
      const result = await response.json().catch(() => null)
      if (!response.ok || !result?.ok) {
        setState({ kind: "error", text: readError(result, "2FA konnte nicht deaktiviert werden.") })
        return
      }
      setDisablePassword("")
      setState({ kind: "success", text: "2FA deaktiviert." })
      await refreshProfile()
    } finally {
      setBusy(null)
    }
  }

  async function logout() {
    setBusy("logout")
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      router.push("/login")
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  const profileStatus = statusLabel(profile.status)
  const profileRole = roleLabel(profile.role)
  const hasAuditEntries = auditEntries.length > 0
  const displayName = [firstName, lastName].filter(Boolean).join(" ").trim() || profile.name || profile.email
  const twoFactorState = profile.twoFactorEnabled ? "Aktiv" : "Vorbereitet"
  const latestLoginMetadata = auditEntries.find((entry) => (entry.action === "auth.login" || entry.action === "auth.login_success") && (entry.accessHost || entry.accessOrigin || entry.publicIp || entry.privateIp || entry.ipAddress || entry.browser || entry.operatingSystem || entry.deviceType))
  const currentSessionMetadata = latestLoginMetadata ? auditMetadata(latestLoginMetadata) : null
  const sessionRows = [
    { label: "Benutzer", value: displayName, icon: UserRound, tone: "violet" },
    { label: "E-Mail", value: profile.email, icon: Mail, tone: "blue" },
    { label: "Rolle", value: profileRole, icon: ShieldCheck, tone: "violet" },
    { label: "Zugriff", value: currentSessionMetadata?.accessHost ?? "Nicht verfügbar", icon: Globe, tone: "green" },
    { label: "Client-IP", value: currentSessionMetadata?.clientIp ?? "Nicht verfügbar", icon: Globe, tone: "green" },
    { label: "Öffentliche IP", value: currentSessionMetadata?.publicIp ?? "Nicht verfügbar", icon: Globe, tone: "green" },
    { label: "Browser", value: currentSessionMetadata?.browser ?? browserLabel, icon: Monitor, tone: "blue" },
    { label: "Betriebssystem", value: currentSessionMetadata?.os ?? osLabel, icon: Laptop, tone: "amber" },
    { label: "Gerät", value: currentSessionMetadata?.device ?? deviceLabel, icon: Monitor, tone: "amber" },
    { label: "Letzte Anmeldung", value: formatDateTime(profile.lastLoginAt), icon: Clock3, tone: "violet" }
  ]

  return (
    <div className={styles.securityPage}>
      <div className={styles.topRow}>
        <Link href="/dashboard-v2" className={styles.backLink}>
          <ArrowLeft size={16} />
          Zurück zum Dashboard
        </Link>
      </div>

      <header className={styles.hero}>
        <div className={styles.heroMain}>
          <div className={styles.heroIcon}>
            <ShieldCheck size={30} />
          </div>
          <div>
            <h1>Konto & Sicherheit</h1>
            <p>Verwalten Sie Ihre persönlichen Daten, Passwort und Sicherheitseinstellungen.</p>
          </div>
        </div>
        <div className={styles.securityStatus}>
          <ShieldCheck size={16} />
          <span>Sicherheitsstatus:</span>
          <strong>{profile.twoFactorEnabled ? "Sehr gut" : "Gut"}</strong>
          <CheckCircle2 size={16} />
        </div>
      </header>

      {state.text ? (
        <div className={state.kind === "success" ? styles.success : styles.error}>{state.text}</div>
      ) : null}

      <div className={styles.accountCardsGrid}>
        <form className={styles.card} onSubmit={submitProfile}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <UserRound size={24} />
            </div>
            <div>
              <h2>Profilinformationen</h2>
              <p>Verwalten Sie Ihre persönlichen Daten.</p>
            </div>
          </div>

          <div className={styles.profileGrid}>
            <label className={styles.field}>
              <span>Vorname</span>
              <input value={firstName} onChange={(event) => setFirstName(event.target.value)} placeholder="Vorname" />
            </label>
            <label className={styles.field}>
              <span>Nachname</span>
              <input value={lastName} onChange={(event) => setLastName(event.target.value)} placeholder="Nachname" />
            </label>
            <label className={styles.fieldWide}>
              <span>E-Mail-Adresse</span>
              <div className={styles.inputWithIcon}>
                <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@firma.de" />
                <Mail size={17} />
              </div>
            </label>
            <label className={styles.field}>
              <span>Rolle</span>
              <select value={profileRole} disabled>
                <option>{profileRole}</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Status</span>
              <select value={profileStatus} disabled>
                <option>{profileStatus}</option>
              </select>
            </label>
          </div>

          <button className={styles.primaryButton} disabled={busy === "profile"} type="submit">
            {busy === "profile" ? "Änderungen werden gespeichert ..." : "Änderungen speichern"}
          </button>
        </form>

        <form className={styles.card} onSubmit={submitPassword}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <LockKeyhole size={24} />
            </div>
            <div>
              <h2>Passwort ändern</h2>
              <p>Aktualisieren Sie Ihr Passwort regelmäßig.</p>
            </div>
          </div>

          <div className={styles.passwordStack}>
            {[
              {
                key: "current" as const,
                label: "Aktuelles Passwort",
                value: passwordForm.currentPassword,
                field: "currentPassword" as const,
                placeholder: "Aktuelles Passwort"
              },
              {
                key: "next" as const,
                label: "Neues Passwort",
                value: passwordForm.nextPassword,
                field: "nextPassword" as const,
                placeholder: "Neues Passwort"
              },
              {
                key: "confirm" as const,
                label: "Neues Passwort bestätigen",
                value: passwordForm.confirmPassword,
                field: "confirmPassword" as const,
                placeholder: "Neues Passwort bestätigen"
              }
            ].map((item) => (
              <label className={styles.field} key={item.key}>
                <span>{item.label}</span>
                <div className={styles.passwordInput}>
                  <input
                    type={showPassword[item.key] ? "text" : "password"}
                    value={item.value}
                    onChange={(event) => setPasswordForm((current) => ({ ...current, [item.field]: event.target.value }))}
                    placeholder={item.placeholder}
                  />
                  <button
                    type="button"
                    className={styles.eyeButton}
                    onClick={() => setShowPassword((current) => ({ ...current, [item.key]: !current[item.key] }))}
                    aria-label={item.label + " ein- oder ausblenden"}
                  >
                    {showPassword[item.key] ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </label>
            ))}
          </div>

          <button className={styles.primaryButton} disabled={busy === "password"} type="submit">
            <LockKeyhole size={15} />
            {busy === "password" ? "Passwort wird gespeichert ..." : "Passwort speichern"}
          </button>
        </form>

        <section className={`${styles.card} ${styles.twoFactorCard}`}>
          <div className={styles.compactHeader}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <ShieldCheck size={23} />
              </div>
              <div>
                <h2>Zwei-Faktor-Authentifizierung</h2>
              </div>
            </div>
            <span className={profile.twoFactorEnabled ? styles.livePill : styles.mutedPill}>{twoFactorState}</span>
          </div>

          <div className={styles.twoFactorGrid}>
            <div className={styles.qrBox}>
              {twoFactorSetup?.qrCodeDataUrl ? (
                <img src={twoFactorSetup.qrCodeDataUrl} alt="2FA QR-Code" />
              ) : (
                <div className={styles.qrPlaceholder}>
                  <QrCode size={42} />
                  <span>2FA vorbereiten</span>
                </div>
              )}
            </div>

            <div className={styles.twoFactorControls}>
              <label className={styles.field}>
                <span className={styles.visuallyHidden}>Code eingeben</span>
                <div className={styles.inputWithIcon}>
                  <input
                    value={twoFactorCode}
                    onChange={(event) => setTwoFactorCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-stelliger Code eingeben"
                    disabled={!twoFactorSetup}
                  />
                  <ShieldCheck size={17} />
                </div>
              </label>

              <div className={styles.secretBox}>
                <strong>{twoFactorSetup?.secret ?? "Nach dem Vorbereiten sichtbar"}</strong>
                <button type="button" onClick={() => void copySecret()} disabled={!twoFactorSetup} aria-label="Secret kopieren">
                  <Copy size={17} />
                </button>
              </div>

              {!profile.twoFactorEnabled ? (
                <button
                  className={styles.primaryButton}
                  disabled={busy === "2fa"}
                  onClick={() => { if (twoFactorSetup) { void activateTwoFactor() } else { void startTwoFactor() } }}
                  type="button"
                >
                  <ShieldCheck size={15} />
                  {busy === "2fa" ? "Arbeite ..." : twoFactorSetup ? "2FA aktivieren" : "2FA vorbereiten"}
                </button>
              ) : (
                <form className={styles.disableForm} onSubmit={disableTwoFactor}>
                  <label className={styles.field}>
                    <span>Passwort zum Deaktivieren</span>
                    <input type="password" value={disablePassword} onChange={(event) => setDisablePassword(event.target.value)} placeholder="Aktuelles Passwort" />
                  </label>
                  <button className={styles.dangerButton} disabled={busy === "disable"} type="submit">
                    {busy === "disable" ? "Deaktiviere ..." : "2FA deaktivieren"}
                  </button>
                </form>
              )}
            </div>

            <div className={styles.twoFactorHint}>
              <ShieldCheck size={16} />
              <span>Schützen Sie Ihr Konto mit 2FA.</span>
            </div>
          </div>

        </section>

        <section className={styles.card}>
          <div className={styles.compactHeader}>
            <div className={styles.cardHeader}>
              <div className={styles.cardIcon}>
                <Monitor size={23} />
              </div>
              <div>
                <h2>Aktive Sitzung</h2>
                <p>Details zu Ihrer aktuellen Sitzung.</p>
              </div>
            </div>
            <span className={styles.livePill}>Live</span>
          </div>

          <div className={styles.sessionList}>
            {sessionRows.map((row) => {
              const Icon = row.icon
              return (
                <div key={row.label} className={styles.sessionRow} data-tone={row.tone}>
                  <span><Icon size={16} /> {row.label}</span>
                  <strong>{row.value}</strong>
                </div>
              )
            })}
          </div>

          <button className={styles.logoutButton} onClick={logout} disabled={busy === "logout"} type="button">
            <LogOut size={15} /> {busy === "logout" ? "Abmelden ..." : "Alle Sitzungen beenden"}
          </button>
        </section>

      </div>

      <section className={`${styles.card} ${styles.activityCard}`}>
        <div className={styles.compactHeader}>
          <div className={styles.cardHeader}>
            <div className={styles.cardIcon}>
              <Clock3 size={23} />
            </div>
              <div>
                <h2>Aktivitätsprotokoll</h2>
                <p>Letzte Aktivitäten in Ihrem Konto.</p>
              </div>
            </div>
            <span className={styles.activityCounter}>{auditLoading ? "Lädt" : hasAuditEntries ? "Alle Aktivitäten" : "Leer"}</span>
          </div>

          {auditLoading ? (
            <div className={styles.emptyState}>Aktivitätsprotokoll wird geladen ...</div>
          ) : hasAuditEntries ? (
            <div className={styles.activityList}>
              {auditEntries.slice(0, 6).map((entry) => {
                const Icon = auditIcon(entry.action)
                const meta = auditMetaText(entry)
                const tone = auditTone(entry.action)
                return (
                  <article key={entry.id} className={styles.activityItem}>
                    <div className={styles.activityIcon} data-tone={tone} aria-hidden="true">
                      <Icon size={15} />
                    </div>
                    <div className={styles.activityBody}>
                      <div className={styles.activityTop}>
                        <strong>{auditTitle(entry.action)}</strong>
                        <time>{formatDateTime(entry.createdAt)}</time>
                      </div>
                      <p>{auditDetailText(entry)}</p>
                      <span>{meta}</span>
                    </div>
                  </article>
                )
              })}
            </div>
          ) : (
            <div className={styles.emptyState}>Noch keine protokollierten Aktivitäten vorhanden.</div>
          )}
      </section>

      <footer className={styles.securityFootnote}>
        <ShieldCheck size={18} />
        Ihre Sicherheit hat höchste Priorität. Alle Daten werden verschlüsselt übertragen und gespeichert.
      </footer>
    </div>
  )
}
