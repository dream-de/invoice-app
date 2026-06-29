export type AuditSeverity = "info" | "success" | "warning" | "error" | "critical"

export type AuditSource =
  | "marketplace"
  | "integration"
  | "open_banking"
  | "module_engine"
  | "auth"
  | "billing"
  | "finance"
  | "api"
  | "system"

export type AuditEventType =
  | "auth_login"
  | "marketplace_module_installed"
  | "marketplace_module_uninstalled"
  | "marketplace_module_install_failed"
  | "marketplace_module_update_started"
  | "marketplace_module_update_completed"
  | "marketplace_module_update_failed"
  | "login_success"
  | "login_failed"
  | "logout"
  | "password_changed"
  | "password_reset_requested"
  | "password_reset_completed"
  | "two_factor_enabled"
  | "two_factor_disabled"
  | "integration_installed"
  | "integration_configured"
  | "integration_connected"
  | "integration_disconnected"
  | "integration_sync_started"
  | "integration_sync_success"
  | "integration_sync_failed"
  | "integration_test_success"
  | "integration_test_failed"
  | "open_banking_bank_connected"
  | "open_banking_bank_disconnected"
  | "open_banking_consent_created"
  | "open_banking_consent_expired"
  | "open_banking_sync_started"
  | "open_banking_sync_success"
  | "open_banking_sync_failed"
  | "open_banking_transactions_imported"
  | "open_banking_payment_matched"
  | "open_banking_invoice_marked_paid"
  | "open_banking_consent_refreshed"
  | "module_access_denied"
  | "module_access_allowed"
  | "module_visible_changed"
  | "module_installed"
  | "module_locked"
  | "module_unlocked"
  | "license_synced"
  | "license_sync_failed"
  | "plan_changed"
  | "subscription_created"
  | "subscription_cancelled"
  | "invoice_created"
  | "invoice_paid"
  | "payment_failed"
  | "feature_flag_changed"
  | "feature_flag_enabled"
  | "feature_flag_disabled"
  | "api_request"
  | "system_event"

export type AuditActor = {
  actorId?: string
  actorName: string
  actorRole: string
}

export type AuditMetadataValue = string | number | boolean | null
export type AuditMetadata = Record<string, AuditMetadataValue>

export type AuditEvent = {
  id: string
  timestamp: string
  type: AuditEventType
  source: AuditSource
  severity: AuditSeverity
  title: string
  description: string
  actor: AuditActor
  moduleKey?: string
  integrationKey?: string
  licensePlan?: string
  featureFlag?: string
  ipAddress?: string
  requestId?: string
  metadata?: AuditMetadata
  before?: AuditMetadata
  after?: AuditMetadata
}

export type AuditEventInput = Omit<AuditEvent, "id" | "timestamp"> & Partial<Pick<AuditEvent, "id" | "timestamp">>

export type AuditEventListener = (events: readonly AuditEvent[]) => void

export type AuditJsonPrimitive = string | number | boolean | null
export type AuditJson = AuditJsonPrimitive | AuditJson[] | { [key: string]: AuditJson | undefined }

export type AuditLogInput = {
  tenantId?: string | null
  workspaceId?: string | null
  actorId?: string | null
  actorName: string
  actorRole?: string | null
  actorEmail?: string | null
  type: string
  source: AuditSource | string
  severity: AuditSeverity
  title: string
  description?: string | null
  moduleKey?: string | null
  integrationKey?: string | null
  marketplaceModuleKey?: string | null
  entityType?: string | null
  entityId?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  browser?: string | null
  device?: string | null
  location?: string | null
  requestId?: string | null
  metadata?: AuditJson
  before?: AuditJson
  after?: AuditJson
}

export type AuditLogFilters = {
  tenantId?: string
  workspaceId?: string
  actorId?: string
  type?: string
  source?: string
  severity?: string
  moduleKey?: string
  integrationKey?: string
  marketplaceModuleKey?: string
  requestId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
  limit?: number
  offset?: number
  cursor?: string
}

export type AuditLogListResponse = {
  ok: true
  logs: AuditEvent[]
  count: number
  nextCursor: string | null
}

export type AuditLogStats = {
  total: number
  bySeverity: Record<string, number>
  bySource: Record<string, number>
  byType: Record<string, number>
}

export type AuditRequestContext = {
  tenantId?: string | null
  workspaceId?: string | null
  actorId?: string | null
  actorName?: string | null
  actorRole?: string | null
  actorEmail?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  browser?: string | null
  device?: string | null
  location?: string | null
  requestId?: string | null
}

export type BackendAuditEventInput = Omit<AuditLogInput, "actorName"> & {
  actor?: {
    actorId?: string | null
    actorName?: string | null
    actorRole?: string | null
    actorEmail?: string | null
  }
  actorName?: string
  requestContext?: AuditRequestContext
}
