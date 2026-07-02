import { archiveOldLogs, getRetentionPolicy } from "@/lib/logs/auditLog.server"

let lastArchiveRun = 0
const MIN_ARCHIVE_INTERVAL_MS = 12 * 60 * 60 * 1000

export function shouldRunArchiveJob(now = new Date()) {
  if (now.getTime() - lastArchiveRun < MIN_ARCHIVE_INTERVAL_MS) return false
  return now.getHours() >= 1
}

export async function archiveLogsByPolicy() {
  const retention = await getRetentionPolicy()
  return archiveOldLogs(retention)
}

export async function runLogArchiveJob(now = new Date()) {
  if (!shouldRunArchiveJob(now)) {
    return { skipped: true, archiveStatistics: null }
  }

  const archiveStatistics = await archiveLogsByPolicy()
  lastArchiveRun = now.getTime()

  return { skipped: false, archiveStatistics }
}
