"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMemo, useState } from "react"
import { getPlanByKey, type LicensePlanKey } from "@/lib/license/plans"
import { useLanguage } from "@/lib/i18n"
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
  role: "owner" | "admin" | "accountant" | "user"
  status: "active" | "inactive" | "disabled"
  lastLoginAt: string | null
  invitedAt: string | null
  disabledAt: string | null
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

const permissionGroups = [
  {
    titleKey: "settings.users.permissions.invoices.title",
    descriptionKey: "settings.users.permissions.invoices.description",
    itemKeys: [
      "settings.users.permissions.invoices.view",
      "settings.users.permissions.invoices.create",
      "settings.users.permissions.invoices.edit",
      "settings.users.permissions.invoices.delete",
      "settings.users.permissions.invoices.finalize",
      "settings.users.permissions.invoices.pdf"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.customers.title",
    descriptionKey: "settings.users.permissions.customers.description",
    itemKeys: [
      "settings.users.permissions.customers.viewCustomers",
      "settings.users.permissions.customers.editCustomers",
      "settings.users.permissions.customers.viewProjects",
      "settings.users.permissions.customers.editProjects"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.finance.title",
    descriptionKey: "settings.users.permissions.finance.description",
    itemKeys: [
      "settings.users.permissions.finance.viewArticles",
      "settings.users.permissions.finance.editArticles",
      "settings.users.permissions.finance.viewFinance"
    ] as const
  },
  {
    titleKey: "settings.users.permissions.admin.title",
    descriptionKey: "settings.users.permissions.admin.description",
    itemKeys: [
      "settings.users.permissions.admin.settings",
      "settings.users.permissions.admin.templates",
      "settings.users.permissions.admin.system",
      "settings.users.permissions.admin.userRights"
    ] as const
  }
] as const

const roleLabels: Record<AppUser["role"], string> = {
  owner: "Owner",
  admin: "Admin",
  accountant: "Buchhaltung",
  user: "Benutzer"
}

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

export function UsersAndPermissionsClient({
  initialUsers,
  initialLimit
}: {
  initialUsers: AppUser[]
  initialLimit: LicenseSummary
}) {
  const router = useRouter()
  const { t } = useLanguage()
  const [users, setUsers] = useState(initialUsers)
  const [limit, setLimit] = useState(initialLimit)
  const [form, setForm] = useState<CreateUserForm>(emptyForm)
  const [draftNames, setDraftNames] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialUsers.map((user) => [user.id, user.name ?? ""]))
  )
  const [state, setState] = useState<SubmitState>({ type: "idle", message: "" })
  const [isCreating, setIsCreating] = useState(false)
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null)

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
  const activePlan = getPlanByKey(limit.plan)
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
      router.refresh()
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Benutzer konnte nicht angelegt werden." })
    } finally {
      setIsCreating(false)
    }
  }

  async function updateUser(user: AppUser, patch: Partial<Pick<AppUser, "name" | "role" | "status">>) {
    setUpdatingUserId(user.id)
    setState({ type: "idle", message: "" })

    try {
      const response = await fetch("/api/settings/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: patch.name ?? draftNames[user.id] ?? user.name ?? "",
          role: patch.role ?? user.role,
          status: patch.status ?? user.status
        })
      })
      const result = await response.json()

      if (!response.ok || !result.ok) {
        setState({ type: "error", message: normalizeApiMessage(result, "Benutzer konnte nicht aktualisiert werden.") })
        return
      }

      setState({ type: "success", message: "Benutzer wurde aktualisiert." })
      await refreshUsers()
      router.refresh()
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Benutzer konnte nicht aktualisiert werden." })
    } finally {
      setUpdatingUserId(null)
    }
  }

  return (
    <div className="min-h-screen bg-[#f4f6f9] px-6 py-8 text-[#1d2433]">
      <div className="mx-auto max-w-6xl">
        <Link href="/settings/categories" className="mb-6 inline-flex text-sm font-medium text-[#64748b] no-underline hover:text-[#111827]">
          {t("settings.users.back")}
        </Link>

        <div className="rounded-[36px] border border-[#e5eaf0] bg-white p-8 shadow-[0_24px_70px_rgba(15,23,42,0.12)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-[#94a3b8]">
                {t("settings.users.eyebrow")}
              </p>
              <h1 className="text-[32px] font-semibold tracking-tight text-[#1d2433]">
                {t("settings.users.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-[#64748b]">
                {t("settings.users.description").replace("{maxUsers}", String(limit.maxUsers))}
              </p>
            </div>

            <div className="rounded-[24px] border border-[#e5eaf0] bg-[#f8fafc] px-5 py-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">{t("settings.users.currentLimit")}</p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-[#94a3b8]">{limit.plan} · {limit.billingCycle}</p>
              <div className="mt-3 flex items-end gap-2">
                <p className="text-[34px] font-medium leading-none text-[#111827]">{limit.activeUsers}</p>
                <p className="pb-1 text-sm font-medium text-[#64748b]">/ {limit.maxUsers} {t("settings.users.users")}</p>
              </div>
              <p className={`mt-3 rounded-full px-3 py-1 text-xs font-semibold ${limit.limitReached ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
                {limit.limitReached ? "Limit erreicht" : `${limit.remainingUsers} Plaetze frei`}
              </p>
            </div>
          </div>

          <section className="mt-8 rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">Benutzerverwaltung</p>
                <h2 className="mt-3 text-lg font-semibold text-[#111827]">Echte App-Benutzer</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#64748b]">
                  Neue Benutzer laufen ab jetzt durch die zentrale Serverlogik. Nur aktive Benutzer zaehlen gegen das Lizenzlimit; eingeladene Benutzer koennen vorbereitet werden.
                </p>
              </div>
              <div className="rounded-[20px] border border-[#e5eaf0] bg-white px-4 py-3 text-sm font-semibold text-[#475569]">
                {activeUsers.length} aktiv · {users.length} gesamt
              </div>
            </div>

            <form onSubmit={handleCreate} className="mt-5 grid gap-3 rounded-[22px] border border-[#e5eaf0] bg-white p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)] lg:grid-cols-[1fr_1.3fr_150px_150px_auto]">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Name
                <input
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  className="min-h-11 rounded-[14px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium normal-case tracking-normal text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                  placeholder="Name"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                E-Mail
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  className="min-h-11 rounded-[14px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium normal-case tracking-normal text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                  placeholder="name@example.test"
                />
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Rolle
                <select
                  value={form.role}
                  onChange={(event) => setForm((current) => ({ ...current, role: event.target.value as AppUser["role"] }))}
                  className="min-h-11 rounded-[14px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium normal-case tracking-normal text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                >
                  {Object.entries(roleLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                Status
                <select
                  value={form.status}
                  onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as AppUser["status"] }))}
                  className="min-h-11 rounded-[14px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium normal-case tracking-normal text-[#111827] outline-none focus:border-[#94a3b8] focus:bg-white"
                >
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>

              <button
                type="submit"
                disabled={isCreating}
                className="min-h-11 self-end rounded-full bg-[#111827] px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(15,23,42,0.18)] transition hover:bg-[#020617] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreating ? "Speichert..." : "Anlegen"}
              </button>
            </form>

            {state.message ? (
              <p className={`mt-4 rounded-[16px] px-4 py-3 text-sm font-semibold ${state.type === "success" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>
                {state.message}
              </p>
            ) : null}

            <div className="mt-5 overflow-hidden rounded-[22px] border border-[#e5eaf0] bg-white">
              <div className="grid grid-cols-[1.1fr_1.4fr_150px_150px_120px_110px] gap-3 border-b border-[#e5eaf0] bg-[#f8fafc] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                <span>Name</span>
                <span>E-Mail</span>
                <span>Rolle</span>
                <span>Status</span>
                <span>Seit</span>
                <span>Aktion</span>
              </div>

              {users.length ? users.map((user) => (
                <div key={user.id} className="grid grid-cols-[1.1fr_1.4fr_150px_150px_120px_110px] items-center gap-3 border-b border-[#eef2f7] px-4 py-3 last:border-b-0">
                  <input
                    value={draftNames[user.id] ?? ""}
                    onChange={(event) => setDraftNames((current) => ({ ...current, [user.id]: event.target.value }))}
                    className="min-h-10 rounded-[12px] border border-transparent bg-[#f8fafc] px-3 text-sm font-medium text-[#111827] outline-none focus:border-[#dbe3ec] focus:bg-white"
                    placeholder="Ohne Namen"
                  />
                  <span className="min-w-0 truncate text-sm font-semibold text-[#111827]">{user.email}</span>
                  <select
                    value={user.role}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => updateUser(user, { role: event.target.value as AppUser["role"] })}
                    className="min-h-10 rounded-[12px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium text-[#111827] outline-none disabled:opacity-60"
                  >
                    {Object.entries(roleLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <select
                    value={user.status}
                    disabled={updatingUserId === user.id}
                    onChange={(event) => updateUser(user, { status: event.target.value as AppUser["status"] })}
                    className="min-h-10 rounded-[12px] border border-[#dbe3ec] bg-[#f8fafc] px-3 text-sm font-medium text-[#111827] outline-none disabled:opacity-60"
                  >
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                  <span className="text-sm font-medium text-[#64748b]">{formatDate(user.createdAt)}</span>
                  <button
                    type="button"
                    disabled={updatingUserId === user.id}
                    onClick={() => updateUser(user, { name: draftNames[user.id] ?? "" })}
                    className="min-h-10 rounded-full border border-[#dbe3ec] bg-white px-4 text-sm font-semibold text-[#111827] transition hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingUserId === user.id ? "..." : "Speichern"}
                  </button>
                </div>
              )) : (
                <div className="px-4 py-8 text-sm font-medium text-[#64748b]">
                  Noch keine Benutzer angelegt.
                </div>
              )}
            </div>
          </section>

          <section className="mt-8 rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#94a3b8]">{t("settings.users.license.eyebrow")}</p>
                <h2 className="mt-3 text-lg font-semibold text-[#111827]">{t("settings.users.license.title")}</h2>
                <p className="mt-2 max-w-2xl text-sm font-medium leading-6 text-[#64748b]">
                  {t("settings.users.license.description")}
                </p>
              </div>
              <span className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${limit.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                {licenseStatusLabel}
              </span>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-[24px] border border-[#e5eaf0] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#94a3b8]">{t("settings.users.license.status.currentPlan")}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <p className="text-[34px] font-semibold leading-none text-[#111827]">{activePlan.name}</p>
                    <p className="mt-2 text-sm font-semibold text-[#64748b]">{planMeta[activePlan.key].billing}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f8fafc] px-4 py-3 text-right">
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-[#94a3b8]">{t("settings.users.license.status.users")}</p>
                    <p className="mt-1 text-xl font-semibold text-[#111827]">{limit.activeUsers} / {formatUsers(limit.maxUsers)}</p>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[18px] bg-[#f8fafc] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.remaining")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">{limit.remainingUsers}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f8fafc] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.validUntil")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">{limit.validUntil ? formatDate(limit.validUntil) : t("settings.users.license.status.noExpiry")}</p>
                  </div>
                  <div className="rounded-[18px] bg-[#f8fafc] p-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#94a3b8]">{t("settings.users.license.status.billing")}</p>
                    <p className="mt-1 text-sm font-semibold text-[#111827]">{limit.billingCycle}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs font-medium leading-5 text-[#64748b]">{planMeta[activePlan.key].note}</p>
              </div>

              <LicenseActivationForm />
            </div>
          </section>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {permissionGroups.map((group) => (
              <section
                key={group.titleKey}
                className="rounded-[28px] border border-[#e5eaf0] bg-[#f8fafc] p-5 shadow-[0_16px_38px_rgba(15,23,42,0.10)]"
              >
                <h2 className="text-lg font-semibold text-[#111827]">{t(group.titleKey)}</h2>
                <p className="mt-2 text-sm font-medium leading-6 text-[#64748b]">{t(group.descriptionKey)}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {group.itemKeys.map((itemKey) => (
                    <span
                      key={itemKey}
                      className="rounded-full border border-[#e5eaf0] bg-white px-3 py-1.5 text-xs font-medium text-[#475569]"
                    >
                      {t(itemKey)}
                    </span>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
