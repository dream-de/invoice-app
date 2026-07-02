import { Prisma, prisma } from "@dream-invoice/database"
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

type AuditLogInput = {
  action: AuditAction
  entity: string
  entityId?: string | null
  reason?: string | null
  data?: Prisma.InputJsonValue
  requestMetadata?: AuditRequestMetadata
  metadata?: Prisma.InputJsonValue
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
  "user.update": "Benutzer aktualisiert"
}

function moduleFromAction(action: AuditAction) {
  if (action.startsWith("auth.") || action.startsWith("account.")) return "authentication"
  if (action.startsWith("invoice.") || action.startsWith("payment.")) return "invoices"
  if (action.startsWith("open_banking.")) return "banking"
  if (action.startsWith("settings.")) return "settings"
  if (action.startsWith("user.")) return "users"
  if (action.includes("time")) return "timeTracking"
  if (action.includes("expense")) return "banking"
  return "system"
}

function levelFromAction(action: AuditAction) {
  if (action.includes("failed") || action.includes("delete")) return "error"
  if (action.includes("succeeded") || action.includes("create") || action.includes("update") || action.includes("activate") || action.includes("login")) return "success"
  return "info"
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
  if (input.action.startsWith("auth.")) return

  const client = options.client ?? prisma

  try {
    const title = ACTION_LABELS[input.action] ?? input.action
    const description = input.reason ?? null
    const module = moduleFromAction(input.action)
    const level = levelFromAction(input.action)
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
      searchableText: searchText([title, description, module, level, input.action, input.entity, input.entityId ?? null])
    }

    if (input.data !== undefined) {
      payload.data = input.data
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

    if (input.metadata !== undefined) {
      payload.metadata = input.metadata
    }

    await client.auditLog.create({ data: payload })
  } catch (error) {
    if (options.throwOnError) throw error
    console.warn("Audit log write failed.", error)
  }
}
