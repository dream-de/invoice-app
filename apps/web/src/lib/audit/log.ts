import { Prisma, prisma } from "@dream-invoice/database"

export type AuditAction =
  | "license.activate"
  | "settings.company.update"
  | "settings.number_ranges.update"
  | "invoice.finalize"
  | "invoice.delete"
  | "user.create"
  | "user.update"

type AuditLogInput = {
  action: AuditAction
  entity: string
  entityId?: string | null
  reason?: string | null
  data?: Prisma.InputJsonValue
}

export async function writeAuditLog(input: AuditLogInput) {
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

    await prisma.auditLog.create({ data: payload })
  } catch (error) {
    console.warn("Audit log write failed.", error)
  }
}
