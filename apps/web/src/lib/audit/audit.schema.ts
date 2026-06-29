import { z } from "zod"

export const auditSeveritySchema = z.enum(["info", "success", "warning", "error", "critical"])

export const auditSourceSchema = z.enum([
  "auth",
  "marketplace",
  "integration",
  "open_banking",
  "module_engine",
  "billing",
  "system",
  "finance",
  "api"
])

export const auditLogInputSchema = z.object({
  tenantId: z.string().trim().optional().nullable(),
  workspaceId: z.string().trim().optional().nullable(),
  actorId: z.string().trim().optional().nullable(),
  actorName: z.string().trim().min(1).default("System"),
  actorRole: z.string().trim().optional().nullable(),
  actorEmail: z.string().trim().optional().nullable(),
  type: z.string().trim().min(1),
  source: auditSourceSchema.or(z.string().trim().min(1)),
  severity: auditSeveritySchema.default("info"),
  title: z.string().trim().min(1),
  description: z.string().trim().optional().nullable(),
  moduleKey: z.string().trim().optional().nullable(),
  integrationKey: z.string().trim().optional().nullable(),
  marketplaceModuleKey: z.string().trim().optional().nullable(),
  entityType: z.string().trim().optional().nullable(),
  entityId: z.string().trim().optional().nullable(),
  ipAddress: z.string().trim().optional().nullable(),
  userAgent: z.string().trim().optional().nullable(),
  browser: z.string().trim().optional().nullable(),
  device: z.string().trim().optional().nullable(),
  location: z.string().trim().optional().nullable(),
  requestId: z.string().trim().optional().nullable(),
  metadata: z.unknown().optional(),
  before: z.unknown().optional(),
  after: z.unknown().optional()
})
