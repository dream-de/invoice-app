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

type AuditLogOptions = {
  client?: AuditLogClient
  throwOnError?: boolean
}

export async function writeAuditLog(input: AuditLogInput, options: AuditLogOptions = {}) {
  if (isDemoMode()) return

  const client = options.client ?? prisma

  try {
    const payload: Prisma.AuditLogCreateInput = {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId ?? null,
      reason: input.reason ?? null
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
