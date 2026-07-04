"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { exportLogsToCsv } from "@/lib/logs/csvExport"
import { exportLogsToExcel } from "@/lib/logs/excelExport"
import { exportLogsToJson } from "@/lib/logs/jsonExport"
import { exportLogsToPdf } from "@/lib/logs/pdfExport"
import type {
  ApiResponse,
  ArchiveStatistics,
  ExportFormat,
  LiveLogSettings,
  LogEntry,
  LogFilters,
  LogLevel,
  LogModule,
  LogOutcome,
  LogRetention,
  LogStatistics,
  LogStatus,
  Pagination
} from "@/lib/logs/types"

export interface UseLiveLogsFilters extends LogFilters {
  status: LogStatus | null
}

export interface LogsListPayload {
  logs: LogEntry[]
  pagination?: Pagination
  statistics?: LogStatistics
  archiveStatistics?: ArchiveStatistics
}

export interface LogsStatsPayload {
  statistics: LogStatistics
}

export interface LogsArchivePayload {
  archiveStatistics: ArchiveStatistics
}

export interface LogsExportPayload {
  url?: string
  fileName?: string
}

export interface UseLiveLogsResult {
  logs: LogEntry[]
  selectedLog: LogEntry | null
  filters: UseLiveLogsFilters
  statistics: LogStatistics | null
  archiveStatistics: ArchiveStatistics | null
  pagination: Pagination
  liveSettings: LiveLogSettings
  loading: boolean
  refreshing: boolean
  exporting: boolean
  archiving: boolean
  error: string | null
  loadLogs: () => Promise<void>
  refreshLogs: () => Promise<void>
  setSearch: (search: string) => void
  setDateRange: (dateFrom: string | null, dateTo: string | null) => void
  setModule: (module: LogModule | null) => void
  setLevel: (level: LogLevel | null) => void
  setStatus: (status: LogStatus | null) => void
  setOutcome: (outcome: LogOutcome | null) => void
  setActor: (actorId: string | null) => void
  setArchived: (archived: boolean | null) => void
  resetFilters: () => void
  selectLog: (log: LogEntry | string) => void
  clearSelection: () => void
  nextPage: () => void
  previousPage: () => void
  setPage: (page: number) => void
  setPageSize: (pageSize: number) => void
  enableLive: () => void
  disableLive: () => void
  pauseLive: () => void
  resumeLive: () => void
  updateRefreshInterval: (refreshInterval: number) => void
  archiveLogs: () => Promise<void>
  restoreArchive: () => Promise<void>
  downloadArchive: () => Promise<void>
  updateRetentionPolicy: (retention: LogRetention) => Promise<void>
  exportCSV: () => Promise<void>
  exportExcel: () => Promise<void>
  exportPDF: () => Promise<void>
  exportJSON: () => Promise<void>
  clearError: () => void
}

const defaultFilters: UseLiveLogsFilters = {
  search: "",
  level: null,
  module: null,
  actorId: null,
  dateFrom: null,
  dateTo: null,
  archived: null,
  retention: null,
  status: null,
  outcome: null
}

const defaultPagination: Pagination = {
  page: 1,
  pageSize: 5,
  totalItems: 0,
  totalPages: 1
}

const defaultLiveSettings: LiveLogSettings = {
  autoRefresh: true,
  refreshInterval: 5000,
  paused: false
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Logs konnten nicht geladen werden."
}

function unwrapResponse<TData>(payload: ApiResponse<TData> | TData): TData {
  if (isRecord(payload) && "success" in payload && "data" in payload) {
    return payload.data as TData
  }

  return payload as TData
}

function appendParam(params: URLSearchParams, key: string, value: string | number | boolean | null) {
  if (value === null || value === "") return
  params.set(key, String(value))
}

function filtersToQuery(filters: UseLiveLogsFilters, page: number, pageSize: number, format?: ExportFormat) {
  const params = new URLSearchParams()
  appendParam(params, "search", filters.search.trim())
  appendParam(params, "level", filters.level)
  appendParam(params, "module", filters.module)
  appendParam(params, "status", filters.status)
  appendParam(params, "outcome", filters.outcome)
  appendParam(params, "actorId", filters.actorId)
  appendParam(params, "dateFrom", filters.dateFrom)
  appendParam(params, "dateTo", filters.dateTo)
  appendParam(params, "archived", filters.archived)
  appendParam(params, "retention", filters.retention)
  appendParam(params, "page", page)
  appendParam(params, "pageSize", pageSize)
  appendParam(params, "format", format ?? null)
  return params
}

function requestHeaders(init?: RequestInit): HeadersInit {
  const headers = new Headers(init?.headers)
  headers.set("Accept", "application/json")

  if (init?.body) {
    headers.set("Content-Type", "application/json")
  }

  return headers
}

async function requestJson<TData>(path: string, init?: RequestInit): Promise<TData> {
  const response = await fetch(path, {
    ...init,
    headers: requestHeaders(init),
    cache: "no-store"
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(body?.message ?? body?.error ?? `HTTP ${response.status}`)
  }

  return response.json() as Promise<TData>
}

async function requestBlob(path: string, init?: RequestInit): Promise<Blob> {
  const response = await fetch(path, {
    ...init,
    cache: "no-store"
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null) as { message?: string; error?: string } | null
    throw new Error(body?.message ?? body?.error ?? `HTTP ${response.status}`)
  }

  return response.blob()
}

function todayArchiveFileName() {
  const date = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date())

  return `dreaminvoice-log-archive-${date}.json`
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function nextPagination(current: Pagination, next?: Pagination) {
  if (!next) return current
  if (
    current.page === next.page &&
    current.pageSize === next.pageSize &&
    current.totalItems === next.totalItems &&
    current.totalPages === next.totalPages
  ) {
    return current
  }

  return next
}

export function useLiveLogs(initialFilters: Partial<UseLiveLogsFilters> = {}): UseLiveLogsResult {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null)
  const [filters, setFilters] = useState<UseLiveLogsFilters>({ ...defaultFilters, ...initialFilters })
  const [statistics, setStatistics] = useState<LogStatistics | null>(null)
  const [archiveStatistics, setArchiveStatistics] = useState<ArchiveStatistics | null>(null)
  const [pagination, setPaginationState] = useState<Pagination>(defaultPagination)
  const [liveSettings, setLiveSettings] = useState<LiveLogSettings>(defaultLiveSettings)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedLog = useMemo(
    () => logs.find((log) => log.id === selectedLogId) ?? null,
    [logs, selectedLogId]
  )

  const fetchLogs = useCallback(async (mode: "load" | "refresh") => {
    if (mode === "load") {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    try {
      const query = filtersToQuery(filters, pagination.page, pagination.pageSize).toString()
      const payload = await requestJson<ApiResponse<LogsListPayload> | LogsListPayload>(`/api/logs${query ? `?${query}` : ""}`)
      const data = unwrapResponse<LogsListPayload>(payload)

      setLogs(Array.isArray(data.logs) ? data.logs : [])
      setPaginationState((current) => nextPagination(current, data.pagination))
      if (data.statistics) setStatistics(data.statistics)
      if (data.archiveStatistics) setArchiveStatistics(data.archiveStatistics)
      setError(null)
    } catch (fetchError) {
      setError(errorMessage(fetchError))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filters, pagination.page, pagination.pageSize])

  const loadLogs = useCallback(async () => {
    await fetchLogs("load")
  }, [fetchLogs])

  const refreshLogs = useCallback(async () => {
    await fetchLogs("refresh")
  }, [fetchLogs])

  const loadStatistics = useCallback(async () => {
    try {
      const query = filtersToQuery(filters, pagination.page, pagination.pageSize).toString()
      const payload = await requestJson<ApiResponse<LogsStatsPayload> | LogsStatsPayload>(`/api/logs/stats${query ? `?${query}` : ""}`)
      setStatistics(unwrapResponse<LogsStatsPayload>(payload).statistics)
    } catch (fetchError) {
      setError(errorMessage(fetchError))
    }
  }, [filters, pagination.page, pagination.pageSize])

  const loadArchiveStatistics = useCallback(async () => {
    try {
      const payload = await requestJson<ApiResponse<LogsArchivePayload> | LogsArchivePayload>("/api/logs/archive")
      setArchiveStatistics(unwrapResponse<LogsArchivePayload>(payload).archiveStatistics)
    } catch (fetchError) {
      setError(errorMessage(fetchError))
    }
  }, [])

  useEffect(() => {
    void loadLogs()
    void loadStatistics()
    void loadArchiveStatistics()
  }, [loadArchiveStatistics, loadLogs, loadStatistics])

  useEffect(() => {
    if (!liveSettings.autoRefresh || liveSettings.paused) return

    const interval = window.setInterval(() => {
      void refreshLogs()
    }, liveSettings.refreshInterval)

    return () => window.clearInterval(interval)
  }, [liveSettings.autoRefresh, liveSettings.paused, liveSettings.refreshInterval, refreshLogs])

  const updateFilters = useCallback((nextFilters: Partial<UseLiveLogsFilters>) => {
    setFilters((current) => ({ ...current, ...nextFilters }))
    setPaginationState((current) => ({ ...current, page: 1 }))
  }, [])

  const setSearch = useCallback((search: string) => updateFilters({ search }), [updateFilters])
  const setDateRange = useCallback((dateFrom: string | null, dateTo: string | null) => updateFilters({ dateFrom, dateTo }), [updateFilters])
  const setModule = useCallback((module: LogModule | null) => updateFilters({ module }), [updateFilters])
  const setLevel = useCallback((level: LogLevel | null) => updateFilters({ level }), [updateFilters])
  const setStatus = useCallback((status: LogStatus | null) => updateFilters({ status }), [updateFilters])
  const setOutcome = useCallback((outcome: LogOutcome | null) => updateFilters({ outcome }), [updateFilters])
  const setActor = useCallback((actorId: string | null) => updateFilters({ actorId }), [updateFilters])
  const setArchived = useCallback((archived: boolean | null) => updateFilters({ archived }), [updateFilters])

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters)
    setPaginationState(defaultPagination)
  }, [])

  const selectLog = useCallback((log: LogEntry | string) => {
    setSelectedLogId(typeof log === "string" ? log : log.id)
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedLogId(null)
  }, [])

  const setPage = useCallback((page: number) => {
    setPaginationState((current) => ({
      ...current,
      page: Math.min(Math.max(page, 1), Math.max(current.totalPages, 1))
    }))
  }, [])

  const nextPage = useCallback(() => {
    setPaginationState((current) => ({
      ...current,
      page: Math.min(current.page + 1, Math.max(current.totalPages, 1))
    }))
  }, [])

  const previousPage = useCallback(() => {
    setPaginationState((current) => ({
      ...current,
      page: Math.max(current.page - 1, 1)
    }))
  }, [])

  const setPageSize = useCallback((pageSize: number) => {
    setPaginationState((current) => ({
      ...current,
      page: 1,
      pageSize: Math.max(pageSize, 1)
    }))
  }, [])

  const enableLive = useCallback(() => {
    setLiveSettings((current) => ({ ...current, autoRefresh: true, paused: false }))
  }, [])

  const disableLive = useCallback(() => {
    setLiveSettings((current) => ({ ...current, autoRefresh: false }))
  }, [])

  const pauseLive = useCallback(() => {
    setLiveSettings((current) => ({ ...current, paused: true }))
  }, [])

  const resumeLive = useCallback(() => {
    setLiveSettings((current) => ({ ...current, paused: false }))
  }, [])

  const updateRefreshInterval = useCallback((refreshInterval: number) => {
    setLiveSettings((current) => ({
      ...current,
      refreshInterval: Math.max(refreshInterval, 1000)
    }))
  }, [])

  const archiveLogs = useCallback(async () => {
    setArchiving(true)
    try {
      const payload = await requestJson<ApiResponse<LogsArchivePayload> | LogsArchivePayload>("/api/logs/archive", {
        method: "POST",
        body: JSON.stringify({ filters })
      })
      setArchiveStatistics(unwrapResponse<LogsArchivePayload>(payload).archiveStatistics)
      setError(null)
      await refreshLogs()
    } catch (archiveError) {
      setError(errorMessage(archiveError))
    } finally {
      setArchiving(false)
    }
  }, [filters, refreshLogs])

  const restoreArchive = useCallback(async () => {
    setArchiving(true)
    try {
      const payload = await requestJson<ApiResponse<LogsArchivePayload> | LogsArchivePayload>("/api/logs/archive/restore", {
        method: "POST",
        body: JSON.stringify({ filters })
      })
      setArchiveStatistics(unwrapResponse<LogsArchivePayload>(payload).archiveStatistics)
      setError(null)
      await refreshLogs()
    } catch (archiveError) {
      setError(errorMessage(archiveError))
    } finally {
      setArchiving(false)
    }
  }, [filters, refreshLogs])

  const updateRetentionPolicy = useCallback(async (retention: LogRetention) => {
    setArchiving(true)
    try {
      const payload = await requestJson<ApiResponse<LogsArchivePayload> | LogsArchivePayload>("/api/logs/retention", {
        method: "POST",
        body: JSON.stringify({ retention })
      })
      setArchiveStatistics(unwrapResponse<LogsArchivePayload>(payload).archiveStatistics)
      updateFilters({ retention })
      setError(null)
    } catch (retentionError) {
      setError(errorMessage(retentionError))
    } finally {
      setArchiving(false)
    }
  }, [updateFilters])

  const downloadArchive = useCallback(async () => {
    setExporting(true)
    try {
      const query = filtersToQuery({ ...filters, archived: true }, pagination.page, pagination.pageSize, "json").toString()
      const blob = await requestBlob(`/api/logs/archive${query ? `?${query}` : ""}`)
      downloadBlob(blob, todayArchiveFileName())
      setError(null)
    } catch (downloadError) {
      setError(errorMessage(downloadError))
    } finally {
      setExporting(false)
    }
  }, [filters, pagination.page, pagination.pageSize])

  const exportCSV = useCallback(async () => {
    setExporting(true)
    try {
      exportLogsToCsv(logs)
      setError(null)
    } catch (exportError) {
      setError(errorMessage(exportError))
    } finally {
      setExporting(false)
    }
  }, [logs])

  const exportExcel = useCallback(async () => {
    setExporting(true)
    try {
      exportLogsToExcel(logs)
      setError(null)
    } catch (exportError) {
      setError(errorMessage(exportError))
    } finally {
      setExporting(false)
    }
  }, [logs])

  const exportPDF = useCallback(async () => {
    setExporting(true)
    try {
      exportLogsToPdf(logs)
      setError(null)
    } catch (exportError) {
      setError(errorMessage(exportError))
    } finally {
      setExporting(false)
    }
  }, [logs])

  const exportJSON = useCallback(async () => {
    setExporting(true)
    try {
      exportLogsToJson(logs)
      setError(null)
    } catch (exportError) {
      setError(errorMessage(exportError))
    } finally {
      setExporting(false)
    }
  }, [logs])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    logs,
    selectedLog,
    filters,
    statistics,
    archiveStatistics,
    pagination,
    liveSettings,
    loading,
    refreshing,
    exporting,
    archiving,
    error,
    loadLogs,
    refreshLogs,
    setSearch,
    setDateRange,
    setModule,
    setLevel,
    setStatus,
    setOutcome,
    setActor,
    setArchived,
    resetFilters,
    selectLog,
    clearSelection,
    nextPage,
    previousPage,
    setPage,
    setPageSize,
    enableLive,
    disableLive,
    pauseLive,
    resumeLive,
    updateRefreshInterval,
    archiveLogs,
    restoreArchive,
    downloadArchive,
    updateRetentionPolicy,
    exportCSV,
    exportExcel,
    exportPDF,
    exportJSON,
    clearError
  }
}
