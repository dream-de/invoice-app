import { Prisma, prisma } from "@dream-invoice/database"
import { getCurrentUser } from "@/lib/auth/service"
import { isDemoMode } from "@/lib/demo-mode"
import { resolveGeoLookup } from "./request-metadata"
import type { AuditRequestMetadata } from "./request-metadata"

export type AuditAction =
  | "auth.login"
  | "auth.login_failed"
  | "auth.logout"
  | "auth.email_verify"
  | "auth.setup"
  | "account.2fa_setup"
  | "account.2fa_disable"
  | "account.2fa_enable"
  | "account.password_update"
  | "account.profile_update"
  | "license.activate"
  | "license.generate"
  | "license.verify"
  | "settings.company.update"
  | "settings.number_ranges.update"
  | "invoice.finalize"
  | "invoice.delete"
  | "invoice.payment.create"
  | "invoice.payment.update"
  | "invoice.payment.delete"
  | "open_banking.status_check"
  | "open_banking.connection_start"
  | "open_banking.connection_callback"
  | "open_banking.connection_blocked"
  | "open_banking.connection_requires_live_provider"
  | "open_banking.bank_connected"
  | "open_banking.bank_disconnected"
  | "open_banking.sync_started"
  | "open_banking.sync_succeeded"
  | "open_banking.sync_failed"
  | "open_banking.payment_detected"
  | "open_banking.invoice_auto_marked_paid"
  | "payment.match_suggested"
  | "payment.match_confirmed"
  | "payment.auto_matched"
  | "payment.manual_matched"
  | "invoice.marked_paid"
  | "premium.time.create"
  | "premium.expense.create"
  | "premium.action"
  | "user.create"
  | "user.delete"
  | "user.update"
  | "customer.create"
  | "customer.update"
  | "customer.delete"
  | "article.create"
  | "article.update"
  | "article.delete"
  | "invoice.create"
  | "invoice.update"
  | "offer.create"
  | "offer.update"
  | "offer.delete"
  | "project.create"
  | "project.update"
  | "time_entry.create"
  | "time_entry.update"
  | "settings.update"
  | "export.create"
  | "api_key.create"
  | "api_key.delete"
  | "webhook.create"
  | "permission.update"
  | "user.role_changed"
  | "user.disabled"
  | "banking.provider_missing"
  | "banking.connection_started"
  | "banking.connection_failed"
  | "banking.connection_success"

type AuditLogInput = {
  action: AuditAction
  entity: string
  entityId?: string | null
  reason?: string | null
  data?: Prisma.InputJsonValue
  requestMetadata?: AuditRequestMetadata
  metadata?: Prisma.InputJsonValue
  before?: Prisma.InputJsonValue
  after?: Prisma.InputJsonValue
  actorUserId?: string | null
  actorName?: string | null
  actorEmail?: string | null
  actorRole?: string | null
  outcome?: "success" | "failed" | "blocked"
  source?: "ui" | "api" | "system"
}

type AuditLogClient = {
  auditLog: {
    create(args: Prisma.AuditLogCreateArgs): Promise<unknown>
  }
}


const ACTION_LABELS: Record<AuditAction, string> = {
  "auth.login": "Login erfolgreich",
  "auth.login_failed": "Login fehlgeschlagen",
  "auth.logout": "Logout",
  "auth.email_verify": "E-Mail verifiziert",
  "auth.setup": "Auth eingerichtet",
  "account.2fa_setup": "2FA vorbereitet",
  "account.2fa_disable": "2FA deaktiviert",
  "account.2fa_enable": "2FA aktiviert",
  "account.password_update": "Passwort geändert",
  "account.profile_update": "Profil aktualisiert",
  "license.activate": "Lizenz aktiviert",
  "license.generate": "Lizenz generiert",
  "license.verify": "Lizenz geprüft",
  "settings.company.update": "Firmeneinstellungen aktualisiert",
  "settings.number_ranges.update": "Nummernkreise aktualisiert",
  "invoice.finalize": "Rechnung finalisiert",
  "invoice.delete": "Rechnung gelöscht",
  "invoice.payment.create": "Zahlung erstellt",
  "invoice.payment.update": "Zahlung aktualisiert",
  "invoice.payment.delete": "Zahlung gelöscht",
  "open_banking.status_check": "Banking Status geprüft",
  "open_banking.connection_start": "Bankverbindung gestartet",
  "open_banking.connection_callback": "Banking Callback verarbeitet",
  "open_banking.connection_blocked": "Banking Provider fehlt",
  "open_banking.connection_requires_live_provider": "Banking Verbindung fehlgeschlagen",
  "open_banking.bank_connected": "Bank verbunden",
  "open_banking.bank_disconnected": "Bank getrennt",
  "open_banking.sync_started": "Banking Synchronisation gestartet",
  "open_banking.sync_succeeded": "Banking Synchronisation erfolgreich",
  "open_banking.sync_failed": "Banking Synchronisation fehlgeschlagen",
  "open_banking.payment_detected": "Zahlung erkannt",
  "open_banking.invoice_auto_marked_paid": "Rechnung automatisch bezahlt markiert",
  "payment.match_suggested": "Zahlungsabgleich vorgeschlagen",
  "payment.match_confirmed": "Zahlungsabgleich bestätigt",
  "payment.auto_matched": "Zahlung automatisch zugeordnet",
  "payment.manual_matched": "Zahlung manuell zugeordnet",
  "invoice.marked_paid": "Rechnung als bezahlt markiert",
  "premium.time.create": "Zeiteintrag erstellt",
  "premium.expense.create": "Ausgabe erstellt",
  "premium.action": "Premium Aktion",
  "user.create": "Benutzer erstellt",
  "user.delete": "Benutzer gelöscht",
  "user.update": "Benutzer aktualisiert",
  "customer.create": "Kunde erstellt",
  "customer.update": "Kunde aktualisiert",
  "customer.delete": "Kunde gelöscht",
  "article.create": "Artikel erstellt",
  "article.update": "Artikel aktualisiert",
  "article.delete": "Artikel gelöscht",
  "invoice.create": "Rechnung erstellt",
  "invoice.update": "Rechnung aktualisiert",
  "offer.create": "Angebot erstellt",
  "offer.update": "Angebot aktualisiert",
  "offer.delete": "Angebot gelöscht",
  "project.create": "Projekt erstellt",
  "project.update": "Projekt aktualisiert",
  "time_entry.create": "Zeiteintrag erstellt",
  "time_entry.update": "Zeiteintrag aktualisiert",
  "settings.update": "Einstellungen aktualisiert",
  "export.create": "Export erstellt",
  "api_key.create": "API-Schlüssel erstellt",
  "api_key.delete": "API-Schlüssel gelöscht",
  "webhook.create": "Webhook erstellt",
  "permission.update": "Berechtigung aktualisiert",
  "user.role_changed": "Benutzerrolle geändert",
  "user.disabled": "Benutzer deaktiviert",
  "banking.provider_missing": "Banking Provider fehlt",
  "banking.connection_started": "Banking Verbindung gestartet",
  "banking.connection_failed": "Banking Verbindung fehlgeschlagen",
  "banking.connection_success": "Banking Verbindung erfolgreich"
}

function moduleFromAction(action: AuditAction) {
  if (action.startsWith("auth.") || action.startsWith("account.")) return "authentication"
  if (action.startsWith("invoice.") || action.startsWith("payment.")) return "invoices"
  if (action.startsWith("offer.")) return "offers"
  if (action.startsWith("customer.")) return "customers"
  if (action.startsWith("article.") || action.startsWith("export.")) return "documents"
  if (action.startsWith("project.")) return "projects"
  if (action.startsWith("time_entry.")) return "timeTracking"
  if (action.startsWith("api_key.") || action.startsWith("webhook.")) return "api"
  if (action.startsWith("permission.")) return "users"
  if (action.startsWith("banking.")) return "banking"
  if (action.startsWith("open_banking.")) return "banking"
  if (action.startsWith("settings.")) return "settings"
  if (action.startsWith("user.")) return "users"
  if (action.includes("time")) return "timeTracking"
  if (action.includes("expense")) return "banking"
  return "system"
}

function levelFromAction(action: AuditAction) {
  if (action.includes("critical")) return "critical"
  if (action.includes("failed") || action.includes("provider_missing") || action.includes("delete")) return "error"
  if (action.includes("disabled") || action.includes("blocked")) return "warning"
  if (action.includes("succeeded") || action.includes("success") || action.includes("create") || action.includes("update") || action.includes("activate") || action.includes("login")) return "success"
  return "info"
}

const SENSITIVE_KEY_PATTERN = /(password|token|secret|apiKey|api[_-]?key|authorization|cookie|set-cookie|refreshToken|accessToken|bank|iban|bic|bankLogin|bankPassword|privateKey|clientSecret)/i

function sanitizeAuditJson(value: unknown): Prisma.InputJsonValue | undefined {
  if (value === undefined) return undefined
  if (value === null) return null as unknown as Prisma.InputJsonValue
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value
  if (Array.isArray(value)) return value.map((item) => sanitizeAuditJson(item) ?? null) as Prisma.InputJsonArray
  if (typeof value !== "object") return String(value)

  const record: Record<string, Prisma.InputJsonValue> = {}
  for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
    record[key] = SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeAuditJson(nestedValue) ?? (null as unknown as Prisma.InputJsonValue)
  }
  return record
}

function canonicalAction(action: AuditAction, data: Record<string, unknown>) {
  if (action === "auth.login") return "login.success"
  if (action === "auth.login_failed") return "login.failed"
  if (action === "auth.logout") return "logout"
  if (action === "user.create") return "user.created"
  if (action === "user.update") {
    if (data.roleChanged) return "user.role_changed"
    if (data.status === "disabled" || data.disabledAt || data.statusChangedTo === "disabled") return "user.disabled"
    if (data.permissions || data.permissionsChanged) return "permission.updated"
    return "user.updated"
  }
  if (action === "user.delete") return "user.disabled"
  if (action === "permission.update") return "permission.updated"
  if (action === "license.activate" || action === "license.generate" || action === "license.verify") return "license.updated"
  if (action === "settings.company.update" || action === "settings.number_ranges.update" || action === "settings.update") return "settings.updated"
  if (action === "invoice.finalize") return "invoice.finalized"
  if (action === "invoice.payment.create" || action === "invoice.payment.update") return "payment.created"
  if (action === "premium.time.create") return "time_entry.created"
  if (action === "open_banking.connection_start") return "banking.connection_started"
  if (action === "open_banking.connection_blocked" || action === "open_banking.status_check") return "banking.provider_missing"
  if (action === "open_banking.connection_requires_live_provider" || action === "open_banking.sync_failed") return "banking.connection_failed"
  if (action === "open_banking.bank_connected" || action === "open_banking.sync_succeeded") return "banking.connection_success"
  if (action === "api_key.create") return "api_key.created"
  if (action === "api_key.delete") return "api_key.deleted"
  if (action === "webhook.create") return "webhook.created"
  if (action === "export.create") return "export.created"
  if (action.endsWith(".create")) return action.replace(/\.create$/, ".created")
  if (action.endsWith(".update")) return action.replace(/\.update$/, ".updated")
  if (action.endsWith(".delete")) return action.replace(/\.delete$/, ".deleted")
  return action
}

function outcomeFromAction(action: string, level: string, explicit?: "success" | "failed" | "blocked") {
  if (explicit) return explicit
  if (action.includes("provider_missing") || action.includes("blocked")) return "blocked"
  if (action.includes("failed") || level === "error" || level === "critical") return "failed"
  return "success"
}

function searchText(values: Array<string | null | undefined>) {
  return values.filter(Boolean).join(" ").toLowerCase()
}

type AuditLogOptions = {
  client?: AuditLogClient
  throwOnError?: boolean
}

export async function writeAuditLog(input: AuditLogInput, options: AuditLogOptions = {}) {
  if (isDemoMode()) return

  const client = options.client ?? prisma

  try {
    const rawData = (input.metadata ?? input.data ?? {}) as Record<string, unknown>
    const actor = input.actorUserId || input.actorEmail ? null : await getCurrentUser().catch(() => null)
    const title = ACTION_LABELS[input.action] ?? input.action
    const description = input.reason ?? null
    const canonical = canonicalAction(input.action, rawData)
    const module = moduleFromAction(input.action)
    const level = levelFromAction(input.action)
    const outcome = outcomeFromAction(canonical, level, input.outcome)
    const source = input.source ?? "ui"
    const metadata = sanitizeAuditJson({
      ...rawData,
      action: canonical,
      outcome,
      source,
      entityType: input.entity,
      entityId: input.entityId ?? null,
      entityLabel: rawData.entityLabel ?? rawData.number ?? rawData.name ?? null
    })
    const payload: Prisma.AuditLogCreateInput = {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      reason: input.reason ?? null,
      title,
      description,
      module,
      level,
      status: "active",
      searchableText: searchText([title, description, module, level, canonical, input.entity, input.entityId ?? null, input.actorEmail, actor?.email]),
      type: canonical,
      source,
      severity: level === "success" ? "info" : level,
      moduleKey: module,
      entityType: input.entity,
      metadata,
      data: metadata,
      actorId: input.actorUserId ?? (String(rawData.actorUserId ?? "") || actor?.id || null),
      actorName: input.actorName ?? actor?.name ?? null,
      actorEmail: input.actorEmail ?? actor?.email ?? null,
      actorRole: input.actorRole ?? actor?.role ?? null,
      before: sanitizeAuditJson(input.before),
      after: sanitizeAuditJson(input.after)
    }

    if (input.requestMetadata) {
      payload.ipAddress = input.requestMetadata.ipAddress ?? input.requestMetadata.publicIp ?? input.requestMetadata.privateIp
      payload.publicIp = input.requestMetadata.publicIp
      payload.privateIp = input.requestMetadata.privateIp
      payload.accessHost = input.requestMetadata.accessHost
      payload.accessProtocol = input.requestMetadata.accessProtocol
      payload.accessOrigin = input.requestMetadata.accessOrigin
      payload.userAgent = input.requestMetadata.userAgent
      payload.browser = input.requestMetadata.browser
      payload.operatingSystem = input.requestMetadata.operatingSystem
      payload.deviceType = input.requestMetadata.deviceType
      payload.country = input.requestMetadata.country
      payload.region = input.requestMetadata.region
      payload.city = input.requestMetadata.city
      payload.timezone = input.requestMetadata.timezone
      payload.geoProvider = input.requestMetadata.geoProvider

      const geo = await resolveGeoLookup(input.requestMetadata.publicIp)
      if (geo) {
        payload.country = geo.country
        payload.region = geo.region
        payload.city = geo.city
        payload.timezone = geo.timezone
        payload.geoProvider = geo.geoProvider
      }
    }

    await client.auditLog.create({ data: payload })
  } catch (error) {
    if (options.throwOnError) throw error
    console.warn("Audit log write failed.", error)
  }
}
