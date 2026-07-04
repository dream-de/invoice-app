export type LogLevel =
  | "success"
  | "info"
  | "warning"
  | "error"
  | "critical"

export type LogStatus =
  | "active"
  | "archived"

export type LogOutcome =
  | "success"
  | "failed"
  | "blocked"

export type LogSource =
  | "ui"
  | "api"
  | "system"

export type LogModule =
  | "authentication"
  | "users"
  | "invoices"
  | "quotes"
  | "offers"
  | "customers"
  | "projects"
  | "timeTracking"
  | "banking"
  | "api"
  | "settings"
  | "system"
  | "datev"
  | "ocr"
  | "documents"
  | "shopify"
  | "woocommerce"
  | "email"
  | "backup"
  | "integrations"

export type LogRetention =
  | 30
  | 90
  | 180
  | 365
  | "unlimited"

export type ExportFormat =
  | "csv"
  | "excel"
  | "pdf"
  | "json"

/** Browser information captured from the request user agent. */
export interface BrowserInfo {
  name: string
  version: string
}

/** Operating system information captured from the request user agent. */
export interface OperatingSystemInfo {
  name: string
  version: string
}

/** Geographic request context resolved from the client IP address. */
export interface GeoLocation {
  country: string
  city: string
  timezone: string
}

/** User, system account, or integration identity responsible for a log entry. */
export interface Actor {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
}

/** Technical request metadata attached to a log entry for traceability. */
export interface LogMetadata {
  requestId: string
  sessionId: string
  traceId: string
  userAgent: string
  referer: string
  method: string
  endpoint: string
  duration: number
  additionalData: Record<string, unknown>
}

/** Immutable enterprise audit log entry used by the Logs dashboard and export APIs. */
export interface LogEntry {
  id: string
  createdAt: string
  updatedAt: string
  title: string
  description: string
  action: string
  module: LogModule
  level: LogLevel
  severity: LogLevel
  outcome: LogOutcome
  source: LogSource
  status: LogStatus
  entityType: string
  entityId: string
  entityLabel: string
  actor: Actor
  ipAddress: string
  browser: BrowserInfo
  operatingSystem: OperatingSystemInfo
  location: GeoLocation
  metadata: LogMetadata
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  archived: boolean
  archivedAt: string | null
  tags: string[]
  searchableText: string
}

/** Filter state sent from the Logs UI to the backend log query API. */
export interface LogFilters {
  search: string
  level: LogLevel | null
  module: LogModule | null
  actorId: string | null
  dateFrom: string | null
  dateTo: string | null
  archived: boolean | null
  retention: LogRetention | null
  outcome: LogOutcome | null
}

/** Aggregated counters and storage metrics for the Logs dashboard cards. */
export interface LogStatistics {
  total: number
  success: number
  warning: number
  error: number
  info: number
  today: number
  lastHour: number
  critical: number
  failed: number
  adminActions: number
  exports: number
  storageSize: number
  archiveSize: number
}

/** Archive state and retention scheduling data for log administration. */
export interface ArchiveStatistics {
  activeLogs: number
  archivedLogs: number
  archiveSize: number
  activeSize: number
  oldestLog: string | null
  nextArchiveDate: string | null
  retention: LogRetention
}

/** Timeline section grouping log entries by calendar date. */
export interface TimelineGroup {
  date: string
  items: LogEntry[]
}

/** Runtime settings for live log polling in the Logs dashboard. */
export interface LiveLogSettings {
  autoRefresh: boolean
  refreshInterval: number
  paused: boolean
}

/** Pagination metadata returned by list endpoints. */
export interface Pagination {
  page: number
  pageSize: number
  totalItems: number
  totalPages: number
}

/** Standard API envelope for log endpoints. */
export interface ApiResponse<TData = unknown> {
  success: boolean
  data: TData
  message: string
  timestamp: string
}
