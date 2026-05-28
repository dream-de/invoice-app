"use client"

import { Check, LockKeyhole, ShieldCheck, Trash2 } from "lucide-react"
import { useMemo, useState } from "react"
import { getPlanByKey, type LicensePlanKey } from "@/lib/license/plans"
import {
  allPermissionDefinitions,
  canEditRolePermissions,
  getEffectivePermissionKeys,
  permissionGroups,
  permissionKey,
  splitPermissionKey,
  type UserPermissionSetting
} from "@/lib/users/permissions"
import { useLanguage } from "@/lib/i18n"
import { SettingsLayout } from "../_components/SettingsLayout"
import { LicenseActivationForm } from "./LicenseActivationForm"

type LicenseSummary = {
  activeUsers: number
  maxUsers: number
  remainingUsers: number
  limitReached: boolean
  plan: string
  billingCycle: string
  status: string
  validUntil: string | null
}

type AppUser = {
  id: string
  name: string | null
  email: string
  role: "admin" | "user"
  status: "active" | "inactive" | "disabled"
  lastLoginAt: string | null
  invitedAt: string | null
  disabledAt: string | null
  permissions: UserPermissionSetting[]
  createdAt: string
  updatedAt: string
}

type SubmitState =
  | { type: "idle"; message: "" }
  | { type: "success"; message: string }
  | { type: "error"; message: string }

type CreateUserForm = {
  name: string
  email: string
  role: AppUser["role"]
  status: AppUser["status"]
}

const roleLabels: Record<AppUser["role"], string> = {
  admin: "Admin",
  user: "Benutzer"
}

const roleOptions = Object.entries(roleLabels) as [AppUser["role"], string][]

const statusLabels: Record<AppUser["status"], string> = {
  active: "Aktiv",
  inactive: "Eingeladen",
  disabled: "Deaktiviert"
}

const emptyForm: CreateUserForm = {
  name: "",
  email: "",
  role: "user",
  status: "inactive"
}

function formatDate(value: string | null) {
  if (!value) return "-"
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  }).format(new Date(value))
}

function normalizeApiMessage(result: unknown, fallback: string) {
  if (typeof result === "object" && result !== null && "error" in result) {
    const error = result.error
    if (typeof error === "string" && error.trim()) return error
  }

  return fallback
}

function compactCardClass(extra = "") {
  return `rounded-[22px] border border-[#e5eaf0] bg-white shadow-[0_12px_30px_rgba(15,23,42,0.07)] ${extra}`
}

function PermissionToggle({
  allowed,
  disabled,
  onClick
}: {
  allowed: boolean
  disabled: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`relative h-6 min-h-0 w-[58px] shrink-0 rounded-full border p-0.5 text-[9px] font-black leading-none transition duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
        allowed
          ? "border-emerald-400 bg-[linear-gradient(180deg,#7ee7ba_0%,#38c98b_54%,#22a86d_100%)] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.7),inset_0_-1px_3px_rgba(6,95,70,0.22),0_4px_8px_rgba(34,197,94,0.18)]"
          : "border-slate-300 bg-[linear-gradient(180deg,#e8edf3_0%,#cbd5e1_100%)] text-slate-500 shadow-[inset_0_1px_1px_rgba(255,255,255,0.86),inset_0_-1px_3px_rgba(100,116,139,0.14),0_3px_7px_rgba(15,23,42,0.07)]"
      }`}
      style={{ height: 24, minHeight: 24 }}
      aria-pressed={allowed}
    >
      <span
        className={`absolute top-1/2 flex h-[18px] w-[18px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[9px] shadow-[0_2px_5px_rgba(15,23,42,0.22),inset_0_1px_0_rgba(255,255,255,0.9)] transition-all duration-200 ${
          allowed ? "left-[36px] text-emerald-600" : "left-1 text-slate-400"
        }`}
      >
        {allowed ? <Check className="h-2.5 w-2.5" /> : null}
      </span>
      <span className={`absolute top-1/2 -translate-y-1/2 transition-all ${allowed ? "left-2" : "right-1.5"}`}>
        {allowed ? "AN" : "AUS"}
      </span>
    </button>
  )
}

export function UsersAndPermissionsClient({
  initialUsers,
  initialLimit
}: {
  initialUsers: AppUser[]
  initialLimit: LicenseSummary
}) {
  const { t } = useLanguage()
  const [users, setUsers] = useState(initialUsers)
  const [limit, setLimit] = useState(initialLimit)
  const [form, setForm] = useState<CreateUserForm>(emptyForm)
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map((user) => [user.id, user.name ?? ""]))
  )
  const [draftEmails, setDraftEmails] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map((user) => [user.id, user.email]))
  )
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState(initialUsers[0]?.id ?? "")
  const [activePermissionGroupKey, setActivePermissionGroupKey] = useState(permissionGroups[0]?.titleKey ?? "")

  const planMeta: Record<LicensePlanKey, { billing: string; note: string }> = {
    free: {
      billing: t("settings.users.plans.free.billing"),
      note: t("settings.users.plans.free.note")
    },
    starter: {
      billing: t("settings.users.plans.starter.billing"),
      note: t("settings.users.plans.starter.note")
    },
    pro: {
      billing: t("settings.users.plans.pro.billing"),
      note: t("settings.users.plans.pro.note")
    },
    team: {
      billing: t("settings.users.plans.team.billing"),
      note: t("settings.users.plans.team.note")
    },
    business: {
      billing: t("settings.users.plans.business.billing"),
      note: t("settings.users.plans.business.note")
    },
    enterprise: {
      billing: t("settings.users.plans.enterprise.billing"),
      note: t("settings.users.plans.enterprise.note")
    },
    unlimited: {
      billing: t("settings.users.plans.unlimited.billing"),
      note: t("settings.users.plans.unlimited.note")
    }
  }

  const activeUsers = useMemo(() => users.filter((user) => user.status === "active"), [users])
  const selectedUser = users.find((user) => user.id === selectedUserId) ?? users[0] ?? null
  const selectedPermissionKeys = selectedUser
    ? getEffectivePermissionKeys(selectedUser.role, selectedUser.permissions)
    : new Set<string>()
  const selectedPermissionsEditable = selectedUser ? canEditRolePermissions(selectedUser.role) : false
  const activePlan = getPlanByKey(limit.plan)
  const activePermissionGroup = permissionGroups.find((group) => group.titleKey === activePermissionGroupKey) ?? permissionGroups[0]
  const licenseStatusLabels: Record<string, string> = {
    active: t("settings.users.license.status.active"),
    unconfigured: t("settings.users.license.status.unconfigured"),
    inactive: t("settings.users.license.status.inactive"),
    expired: t("settings.users.license.status.expired"),
    invalid: t("settings.users.license.status.invalid")
  }
  const licenseStatusLabel = licenseStatusLabels[limit.status] ?? limit.status

  function formatUsers(maxUsers: number | null) {
    return maxUsers === null ? t("settings.users.planUsers.unlimited") : String(maxUsers)
  }

  async function refreshUsers() {
    const response = await fetch("/api/settings/users", { cache: "no-store" })
    const result = await response.json()

    if (!response.ok || !result.ok) {
      throw new Error(normalizeApiMessage(result, "Benutzer konnten nicht geladen werden."))
    }

    setUsers(result.users)
    setLimit(result.limit)
    setDraftNames(Object.fromEntries(result.users.map((user: AppUser) => [user.id, user.name ?? ""])))
    setDraftEmails(Object.fromEntries(result.users.map((user: AppUser) => [user.id, user.email])))
    setSelectedUserId((current) => {
      if (result.users.some((user: AppUser) => user.id === current)) return current
      return result.users[0]?.id ?? ""
    })
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsCreating(true)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: normalizeApiMessage(result, "Benutzer konnte nicht angelegt werden.") })
        return
      }

      setForm(emptyForm)
      setState({ type: "success", message: "Benutzer wurde angelegt." })
      await refreshUsers()
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Benutzer konnte nicht angelegt werden." })
    } finally {
      setIsCreating(false)
    }
  }

  async function updateUser(user: AppUser, patch: Partial<Pick<AppUser, "name" | "email" | "role" | "status" | "permissions">>) {
    setUpdatingUserId(user.id)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: patch.name ?? draftNames[user.id] ?? user.name ?? "",
          email: patch.email ?? draftEmails[user.id] ?? user.email,
          role: patch.role ?? user.role,
          status: patch.status ?? user.status,
          ...(patch.permissions ? { permissions: patch.permissions } : {})
        })
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: normalizeApiMessage(result, "Benutzer konnte nicht aktualisiert werden.") })
        return
      }

      setState({ type: "success", message: "Benutzer wurde aktualisiert." })
      await refreshUsers()
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Benutzer konnte nicht aktualisiert werden." })
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function deleteUser(user: AppUser) {
    setUpdatingUserId(user.id)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/users", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id })
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: normalizeApiMessage(result, "Benutzer konnte nicht geloescht werden.") })
        return
      }

      setState({ type: "success", message: "Benutzer wurde geloescht." })
      await refreshUsers()
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Benutzer konnte nicht geloescht werden." })
    } finally {
      setUpdatingUserId(null)
    }
  }

  async function updatePermission(user: AppUser, key: string, allowed: boolean) {
    if (!canEditRolePermissions(user.role)) return

    const keys = getEffectivePermissionKeys(user.role, user.permissions)
    if (allowed) {
      keys.add(key)
    } else {
      keys.delete(key)
    }

    const permissions = allPermissionDefinitions.map((permission) => {
      const nextKey = permissionKey(permission)
      const { scope, action } = splitPermissionKey(nextKey)
      return {
        scope,
        action,
        allowed: keys.has(nextKey)
      }
    })

    await updateUser(user, { permissions })
    setState({ type: "success", message: "Berechtigung wurde gespeichert." })
  }

  return (
    <SettingsLayout
      title={t("settings.users.title")}
      description={t("settings.users.description").replace("{maxUsers}", String(limit.maxUsers))}
    >
      <div className="space-y-5">
        <section className={compactCardClass("overflow-hidden p-0")}>
          <div className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#94a3b8]">Lizenzstatus</p>
              <h2 className="mt-2 text-xl font-black text-[#111827]">{activePlan.name}</h2>
              <p className="mt-1 text-sm font-semibold text-[#64748b]">{planMeta[activePlan.key].billing}</p>
            </div>

            <div className="grid flex-1 gap-0 overflow-hidden rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] sm:grid-cols-4">
              <div className="border-b border-[#e5eaf0] p-4 sm:border-b-0 sm:border-r">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.users")}</p>
                <p className="mt-2 text-xl font-black leading-none text-[#111827]">{limit.activeUsers} / {formatUsers(limit.maxUsers)}</p>
                <p className="mt-1 text-xs font-bold text-[#64748b]">{t("settings.users.users")}</p>
              </div>
              <div className="border-b border-[#e5eaf0] p-4 sm:border-b-0 sm:border-r">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.remaining")}</p>
                <p className={`mt-2 text-xl font-black leading-none ${limit.limitReached ? "text-red-600" : "text-[#111827]"}`}>{limit.remainingUsers}</p>
                <p className={`mt-1 text-xs font-bold ${limit.limitReached ? "text-red-600" : "text-emerald-700"}`}>{limit.limitReached ? "Limit erreicht" : "Plaetze frei"}</p>
              </div>
              <div className="border-b border-[#e5eaf0] p-4 sm:border-b-0 sm:border-r">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">Status</p>
                <p className="mt-2 inline-flex items-center gap-2 text-xl font-black leading-none text-[#111827]">
                  <span className={`h-2.5 w-2.5 rounded-full shadow-[0_0_0_4px_rgba(16,185,129,0.12)] ${limit.status === "active" ? "bg-emerald-500" : "bg-slate-300"}`} />
                  {licenseStatusLabel}
                </p>
                <p className="mt-1 text-xs font-bold text-[#64748b]">{limit.validUntil ? formatDate(limit.validUntil) : t("settings.users.license.status.noExpiry")}</p>
              </div>
              <div className="p-4">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">Plan</p>
                <p className="mt-2 text-sm font-black leading-none text-[#111827]">{activePlan.name} · {limit.remainingUsers} frei</p>
                <a href="#license-manage" className="mt-3 inline-flex h-8 items-center rounded-full bg-[#111827] px-3 text-xs font-black text-white no-underline shadow-[0_8px_18px_rgba(15,23,42,0.16)]">
                  Lizenz verwalten
                </a>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[430px_minmax(0,1fr)]">
          <section className={compactCardClass("p-5")}>
            <h2 className="text-lg font-black text-[#111827]">Benutzer anlegen</h2>
            <form onSubmit={handleCreate} className="mt-4 grid gap-3">
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="min-h-11 rounded-[12px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder="Name"
              />
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="min-h-11 rounded-[12px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-semibold text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                placeholder="E-Mail"
              />
              <select
                value={form.role}
                onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppUser["role"] }))}
                className="min-h-11 rounded-[12px] border border-[#dbe3ec] bg-white px-3 text-sm font-semibold text-[#111827] outline-none"
              >
                {roleOptions.map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AppUser["status"] }))}
                  className="min-h-11 rounded-[12px] border border-[#dbe3ec] bg-white px-3 text-sm font-semibold text-[#111827] outline-none"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="min-h-11 rounded-[12px] bg-[#111827] px-5 text-sm font-black text-white transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isCreating ? "..." : "Anlegen"}
                </button>
              </div>
            </form>
          </section>

          <section className={compactCardClass("p-5")}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-[#111827]">Benutzerliste</h2>
              <span className="rounded-full bg-[#f8fafc] px-3 py-1 text-xs font-black text-[#64748b]">
                {activeUsers.length} aktiv · {users.length} gesamt
              </span>
            </div>
            <div className="mt-4 overflow-hidden rounded-[18px] border border-[#e5eaf0]">
                <div className="grid grid-cols-[minmax(110px,1fr)_minmax(170px,1.35fr)_104px_104px_188px] gap-2 border-b border-[#e5eaf0] bg-[#f8fafc] px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">
                  <span>Name</span>
                  <span>E-Mail</span>
                  <span>Rolle</span>
                  <span>Status</span>
                  <span>Aktionen</span>
                </div>
                {users.map((user) => (
                  <div key={user.id} className="grid grid-cols-[minmax(110px,1fr)_minmax(170px,1.35fr)_104px_104px_188px] items-center gap-2 border-b border-[#eef2f7] px-3 py-2 last:border-b-0">
                    <div>
                      <input
                        value={draftNames[user.id] ?? ""}
                        onChange={(event) => setDraftNames((current) => ({ ...current, [user.id]: event.target.value }))}
                        className="min-h-9 w-full rounded-[10px] border border-transparent bg-[#f8fafc] px-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#dbe3ec] focus:bg-white"
                        placeholder="Ohne Namen"
                      />
                      <p className="mt-1 px-2 text-[11px] font-bold text-[#94a3b8]">{formatDate(user.createdAt)}</p>
                    </div>
                    <input
                      type="email"
                      value={draftEmails[user.id] ?? ""}
                      onChange={(event) => setDraftEmails((current) => ({ ...current, [user.id]: event.target.value }))}
                      className="min-h-9 w-full rounded-[10px] border border-transparent bg-[#f8fafc] px-2 text-sm font-semibold text-[#111827] outline-none focus:border-[#dbe3ec] focus:bg-white"
                      placeholder="name@example.test"
                    />
                    <select
                      value={user.role}
                      disabled={updatingUserId === user.id}
                      onChange={(event) => updateUser(user, { role: event.target.value as AppUser["role"] })}
                      className="min-h-9 w-full rounded-[10px] border border-[#dbe3ec] bg-white px-2 text-sm font-semibold text-[#111827] outline-none disabled:opacity-60"
                    >
                      {roleOptions.map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <select
                      value={user.status}
                      disabled={updatingUserId === user.id}
                      onChange={(event) => updateUser(user, { status: event.target.value as AppUser["status"] })}
                      className="min-h-9 w-full rounded-[10px] border border-[#dbe3ec] bg-white px-2 text-sm font-semibold text-[#111827] outline-none disabled:opacity-60"
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedUserId(user.id)}
                        className={`h-8 rounded-full px-2.5 text-xs font-black transition ${selectedUser?.id === user.id ? "bg-[#111827] text-white" : "bg-[#eef2f7] text-[#334155]"}`}
                      >
                        Rechte
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === user.id}
                        onClick={() => updateUser(user, { name: draftNames[user.id] ?? "", email: draftEmails[user.id] ?? user.email })}
                        className="h-8 rounded-full bg-white px-2.5 text-xs font-black text-[#111827] ring-1 ring-[#dbe3ec] disabled:opacity-60"
                      >
                        Speichern
                      </button>
                      <button
                        type="button"
                        disabled={updatingUserId === user.id}
                        onClick={() => deleteUser(user)}
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-red-50 text-red-600 ring-1 ring-red-100 disabled:opacity-60"
                        aria-label="Benutzer loeschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </section>
        </div>

        {state.message ? (
          <p className={`rounded-[16px] px-4 py-3 text-sm font-semibold ${state.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
            {state.message}
          </p>
        ) : null}

        {selectedUser ? (
          <section className={compactCardClass("p-5")}>
            <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#94a3b8]">Berechtigungen</p>
                <h2 className="mt-2 text-lg font-black text-[#111827]">{selectedUser.name || selectedUser.email}</h2>
                <p className="mt-1 text-sm font-semibold text-[#64748b]">
                  {selectedPermissionsEditable ? "Rechte kompakt verwalten." : "Admins haben automatisch Vollzugriff."}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {users.map((user) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => setSelectedUserId(user.id)}
                    className={`min-h-9 rounded-full px-4 text-sm font-black transition ${selectedUser.id === user.id ? "bg-[#111827] text-white" : "bg-[#f8fafc] text-[#64748b] ring-1 ring-[#e5eaf0]"}`}
                  >
                    {user.name || user.email}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex max-w-full gap-1 overflow-x-auto rounded-[16px] border border-[#e5eaf0] bg-white p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.9),0_10px_24px_rgba(15,23,42,0.05)]">
              {permissionGroups.map((group) => (
                <button
                  key={group.titleKey}
                  type="button"
                  onClick={() => setActivePermissionGroupKey(group.titleKey)}
                  className={`min-h-9 shrink-0 rounded-[12px] px-5 text-sm font-black transition ${activePermissionGroup?.titleKey === group.titleKey ? "bg-[#334155] text-white shadow-[0_4px_10px_rgba(15,23,42,0.16)]" : "text-[#64748b] hover:bg-[#f8fafc]"}`}
                >
                  {t(group.titleKey)}
                </button>
              ))}
            </div>

            {activePermissionGroup ? (
              <div className="mt-4 grid gap-4 xl:grid-cols-[0.86fr_1.14fr]">
                <section className="rounded-[18px] border border-[#e5eaf0] bg-[#f8fafc] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-black text-[#111827]">{t(activePermissionGroup.titleKey)}</h3>
                      <p className="mt-1 text-sm font-semibold leading-6 text-[#64748b]">{t(activePermissionGroup.descriptionKey)}</p>
                    </div>
                    {selectedPermissionsEditable ? (
                      <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-[#94a3b8]" />
                    ) : (
                      <LockKeyhole className="mt-1 h-5 w-5 shrink-0 text-[#94a3b8]" />
                    )}
                  </div>
                  <div className="mt-4 grid gap-2">
                    {activePermissionGroup.permissions.map((permission) => {
                      const key = permissionKey(permission)
                      const allowed = selectedPermissionKeys.has(key)

                      return (
                        <div key={key} className={`flex min-h-10 items-center justify-between gap-3 rounded-[13px] border px-3 transition ${allowed ? "border-emerald-100 bg-white shadow-[inset_0_0_0_1px_rgba(16,185,129,0.05)]" : "border-[#e5eaf0] bg-white"}`}>
                          <span className="text-sm font-black text-[#111827]">{t(permission.labelKey)}</span>
                          <PermissionToggle
                            allowed={allowed}
                            disabled={!selectedPermissionsEditable || updatingUserId === selectedUser.id}
                            onClick={() => updatePermission(selectedUser, key, !allowed)}
                          />
                        </div>
                      )
                    })}
                  </div>
                </section>

                <div className="grid gap-3 md:grid-cols-2">
                  {permissionGroups.map((group) => {
                    const enabledCount = group.permissions.filter((permission) => selectedPermissionKeys.has(permissionKey(permission))).length

                    return (
                      <button
                        key={group.titleKey}
                        type="button"
                        onClick={() => setActivePermissionGroupKey(group.titleKey)}
                        className={`rounded-[18px] border p-4 text-left transition ${activePermissionGroup.titleKey === group.titleKey ? "border-[#334155] bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]" : "border-[#e5eaf0] bg-[#f8fafc] hover:bg-white"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-black text-[#111827]">{t(group.titleKey)}</p>
                            <p className="mt-1 text-xs font-semibold text-[#64748b]">{enabledCount} / {group.permissions.length} aktiv</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-black ring-1 ${activePermissionGroup.titleKey === group.titleKey ? "bg-[#f8fafc] text-[#334155] ring-[#cbd5e1]" : "bg-white text-[#64748b] ring-[#e5eaf0]"}`}>
                            {activePermissionGroup.titleKey === group.titleKey ? "Offen" : "Ansehen"}
                          </span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </section>
        ) : null}

        <section id="license-manage" className={compactCardClass("p-5")}>
          <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-[#94a3b8]">{t("settings.users.license.eyebrow")}</p>
              <h2 className="mt-2 text-lg font-black text-[#111827]">Lizenz verwalten</h2>
            </div>
            <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${limit.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
              {licenseStatusLabel}
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
            <div className="rounded-[20px] border border-[#e5eaf0] bg-[#f8fafc] p-4">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#94a3b8]">{t("settings.users.license.status.currentPlan")}</p>
              <div className="mt-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-3xl font-semibold leading-none text-[#111827]">{activePlan.name}</p>
                  <p className="mt-2 text-sm font-semibold text-[#64748b]">{planMeta[activePlan.key].billing}</p>
                </div>
                <div className="rounded-[16px] bg-white px-4 py-3 text-right">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.users")}</p>
                  <p className="mt-1 text-xl font-semibold text-[#111827]">{limit.activeUsers} / {formatUsers(limit.maxUsers)}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-[14px] bg-white p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">{t("settings.users.license.status.remaining")}</p>
                  <p className="mt-1 text-sm font-black text-[#111827]">{limit.remainingUsers}</p>
                </div>
                <div className="rounded-[14px] bg-white p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">{t("settings.users.license.status.validUntil")}</p>
                  <p className="mt-1 text-sm font-black text-[#111827]">{limit.validUntil ? formatDate(limit.validUntil) : t("settings.users.license.status.noExpiry")}</p>
                </div>
                <div className="rounded-[14px] bg-white p-3">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-[#94a3b8]">{t("settings.users.license.status.billing")}</p>
                  <p className="mt-1 text-sm font-black text-[#111827]">{limit.billingCycle}</p>
                </div>
              </div>
            </div>
            <LicenseActivationForm />
          </div>
        </section>
      </div>
    </SettingsLayout>
  )
}
