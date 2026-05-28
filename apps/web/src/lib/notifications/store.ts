import { promises as fs } from "node:fs"
import path from "node:path"

export const notificationCategories = ["documents", "email", "settings", "security", "system"] as const
export const notificationTones = ["success", "warning", "info"] as const

export type NotificationCategory = (typeof notificationCategories)[number]
export type NotificationTone = (typeof notificationTones)[number]

export type NotificationSettings = {
  enabled: boolean
  categories: Record<NotificationCategory, boolean>
  updatedAt?: string
}

export type StoredNotification = {
  id: string
  createdAt: string
  category: NotificationCategory
  tone: NotificationTone
  title: string
  message: string
  href?: string
  source?: string
  readBy?: string[]
}

export type NotificationInput = {
  category: NotificationCategory
  tone: NotificationTone
  title: string
  message: string
  href?: string
  source?: string
}

const NOTIFICATIONS_PATH = path.join(process.cwd(), "data", "notifications.local.json")
const SETTINGS_PATH = path.join(process.cwd(), "data", "notification-settings.local.json")
const MAX_NOTIFICATIONS = 250
const MAX_FIELD_LENGTH = 500

export const defaultNotificationSettings: NotificationSettings = {
  enabled: true,
  categories: {
    documents: true,
    email: true,
    settings: true,
    security: true,
    system: true
  }
}

function cleanText(value: string) {
  const trimmed = String(value ?? "").trim()
  return trimmed.length > MAX_FIELD_LENGTH ? trimmed.slice(0, MAX_FIELD_LENGTH) + "..." : trimmed
}

function normalizeSettings(value: Partial<NotificationSettings> | null | undefined): NotificationSettings {
  return {
    enabled: value?.enabled !== false,
    categories: {
      documents: value?.categories?.documents !== false,
      email: value?.categories?.email !== false,
      settings: value?.categories?.settings !== false,
      security: value?.categories?.security !== false,
      system: value?.categories?.system !== false
    },
    updatedAt: value?.updatedAt
  }
}

function isCategory(value: unknown): value is NotificationCategory {
  return typeof value === "string" && notificationCategories.includes(value as NotificationCategory)
}

function isTone(value: unknown): value is NotificationTone {
  return typeof value === "string" && notificationTones.includes(value as NotificationTone)
}

function normalizeNotification(value: unknown): StoredNotification | null {
  if (!value || typeof value !== "object") return null
  const item = value as Partial<StoredNotification>

  if (
    typeof item.id !== "string" ||
    typeof item.createdAt !== "string" ||
    typeof item.title !== "string" ||
    typeof item.message !== "string" ||
    !isCategory(item.category) ||
    !isTone(item.tone)
  ) {
    return null
  }

  return {
    id: item.id,
    createdAt: item.createdAt,
    category: item.category,
    tone: item.tone,
    title: cleanText(item.title),
    message: cleanText(item.message),
    href: typeof item.href === "string" ? cleanText(item.href) : undefined,
    source: typeof item.source === "string" ? cleanText(item.source) : undefined,
    readBy: Array.isArray(item.readBy)
      ? item.readBy.filter((id): id is string => typeof id === "string")
      : []
  }
}

async function readNotifications(): Promise<StoredNotification[]> {
  try {
    const raw = await fs.readFile(NOTIFICATIONS_PATH, "utf8")
    const data = JSON.parse(raw)
    return Array.isArray(data)
      ? data.map(normalizeNotification).filter((item): item is StoredNotification => Boolean(item))
      : []
  } catch {
    return []
  }
}

async function writeNotifications(items: StoredNotification[]) {
  await fs.mkdir(path.dirname(NOTIFICATIONS_PATH), { recursive: true })
  await fs.writeFile(NOTIFICATIONS_PATH, JSON.stringify(items.slice(0, MAX_NOTIFICATIONS), null, 2))
}

export async function readNotificationSettings(): Promise<NotificationSettings> {
  try {
    const raw = await fs.readFile(SETTINGS_PATH, "utf8")
    return normalizeSettings(JSON.parse(raw) as Partial<NotificationSettings>)
  } catch {
    return defaultNotificationSettings
  }
}

export async function writeNotificationSettings(settings: Partial<NotificationSettings>) {
  const next = normalizeSettings({
    ...settings,
    updatedAt: new Date().toISOString()
  })

  await fs.mkdir(path.dirname(SETTINGS_PATH), { recursive: true })
  await fs.writeFile(SETTINGS_PATH, JSON.stringify(next, null, 2))

  return next
}

export async function appendNotification(input: NotificationInput) {
  const settings = await readNotificationSettings()
  if (!settings.enabled || settings.categories[input.category] === false) return null

  const current = await readNotifications()
  const next: StoredNotification = {
    id: "notification-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8),
    createdAt: new Date().toISOString(),
    category: input.category,
    tone: input.tone,
    title: cleanText(input.title),
    message: cleanText(input.message),
    href: input.href ? cleanText(input.href) : undefined,
    source: input.source ? cleanText(input.source) : undefined,
    readBy: []
  }

  const withoutDuplicate = next.source
    ? current.filter((item) => item.source !== next.source)
    : current

  await writeNotifications([next, ...withoutDuplicate])
  return next
}

export async function listNotifications(userId: string, limit = 20) {
  const settings = await readNotificationSettings()
  if (!settings.enabled) {
    return { notifications: [], unreadCount: 0, settings }
  }

  const notifications = (await readNotifications())
    .filter((item) => settings.categories[item.category] !== false)
    .map((item) => ({
      ...item,
      read: item.readBy?.includes(userId) ?? false
    }))

  return {
    notifications: notifications.slice(0, Math.min(Math.max(limit, 1), 100)),
    unreadCount: notifications.filter((item) => !item.read).length,
    settings
  }
}

export async function markNotificationsRead(userId: string, ids?: string[]) {
  const targetIds = Array.isArray(ids) ? new Set(ids.filter(Boolean)) : null
  const notifications = await readNotifications()
  let changed = false

  const next = notifications.map((item) => {
    if (targetIds && !targetIds.has(item.id)) return item
    if (item.readBy?.includes(userId)) return item

    changed = true
    return {
      ...item,
      readBy: [...(item.readBy ?? []), userId]
    }
  })

  if (changed) {
    await writeNotifications(next)
  }

  return listNotifications(userId)
}
