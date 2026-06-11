import { Prisma, prisma } from "@dream-invoice/database"
import { isDemoMode } from "@/lib/demo-mode"

export type AuditAction =
  | "auth.login"
  | "auth.email_verify"
  | "auth.setup"
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

    await client.auditLog.create({ data: payload })
  } catch (error) {
    if (options.throwOnError) throw error
    console.warn("Audit log write failed.", error)
  }
}
