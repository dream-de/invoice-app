import type { TranslationKey } from "@/i18n/dictionary"
import type { UserRole } from "@dream-invoice/auth"

export type PermissionDefinition = {
  scope: string
  action: string
  labelKey: TranslationKey
}

export type PermissionGroup = {
  titleKey: TranslationKey
  descriptionKey: TranslationKey
  permissions: readonly PermissionDefinition[]
}

export type UserPermissionSetting = {
  scope: string
  action: string
  allowed: boolean
}

export const permissionGroups: PermissionGroup[] = [
  {
    titleKey: "settings.users.permissions.invoices.title",
    descriptionKey: "settings.users.permissions.invoices.description",
    permissions: [
      { scope: "documents", action: "view", labelKey: "settings.users.permissions.invoices.view" },
      { scope: "documents", action: "create", labelKey: "settings.users.permissions.invoices.create" },
      { scope: "documents", action: "edit", labelKey: "settings.users.permissions.invoices.edit" },
      { scope: "documents", action: "delete", labelKey: "settings.users.permissions.invoices.delete" },
      { scope: "documents", action: "finalize", labelKey: "settings.users.permissions.invoices.finalize" },
      { scope: "documents", action: "pdf", labelKey: "settings.users.permissions.invoices.pdf" }
    ]
  },
  {
    titleKey: "settings.users.permissions.customers.title",
    descriptionKey: "settings.users.permissions.customers.description",
    permissions: [
      { scope: "customers", action: "view", labelKey: "settings.users.permissions.customers.viewCustomers" },
      { scope: "customers", action: "edit", labelKey: "settings.users.permissions.customers.editCustomers" },
      { scope: "projects", action: "view", labelKey: "settings.users.permissions.customers.viewProjects" },
      { scope: "projects", action: "edit", labelKey: "settings.users.permissions.customers.editProjects" }
    ]
  },
  {
    titleKey: "settings.users.permissions.finance.title",
    descriptionKey: "settings.users.permissions.finance.description",
    permissions: [
      { scope: "articles", action: "view", labelKey: "settings.users.permissions.finance.viewArticles" },
      { scope: "articles", action: "edit", labelKey: "settings.users.permissions.finance.editArticles" },
      { scope: "finance", action: "view", labelKey: "settings.users.permissions.finance.viewFinance" }
    ]
  },
  {
    titleKey: "settings.users.permissions.portal.title",
    descriptionKey: "settings.users.permissions.portal.description",
    permissions: [
      { scope: "portal", action: "offer", labelKey: "settings.users.permissions.portal.offerPortal" },
      { scope: "archive", action: "use", labelKey: "settings.users.permissions.portal.archiveUse" },
      { scope: "archive", action: "configure", labelKey: "settings.users.permissions.portal.archiveConfigure" }
    ]
  },
  {
    titleKey: "settings.users.permissions.admin.title",
    descriptionKey: "settings.users.permissions.admin.description",
    permissions: [
      { scope: "settings", action: "manage", labelKey: "settings.users.permissions.admin.settings" },
      { scope: "templates", action: "manage", labelKey: "settings.users.permissions.admin.templates" },
      { scope: "system", action: "manage", labelKey: "settings.users.permissions.admin.system" },
      { scope: "users", action: "manage", labelKey: "settings.users.permissions.admin.userRights" }
    ]
  }
]

export const allPermissionDefinitions = permissionGroups.flatMap((group) => group.permissions)

export function permissionKey(permission: Pick<UserPermissionSetting, "scope" | "action">) {
  return `${permission.scope}:${permission.action}`
}

export function splitPermissionKey(key: string) {
  const [scope, action] = key.split(":")
  return { scope, action }
}

export function isKnownPermission(scope: string, action: string) {
  return allPermissionDefinitions.some(
    (permission) => permission.scope === scope && permission.action === action
  )
}

export function canEditRolePermissions(role: UserRole) {
  return role !== "owner" && role !== "admin"
}

export function getRoleDefaultPermissionKeys(role: UserRole) {
  const allKeys = allPermissionDefinitions.map(permissionKey)

  if (role === "owner" || role === "admin") return new Set(allKeys)

  if (role === "accountant") {
    return new Set([
      "documents:view",
      "documents:create",
      "documents:edit",
      "documents:finalize",
      "documents:pdf",
      "customers:view",
      "projects:view",
      "articles:view",
      "finance:view"
    ])
  }

  return new Set(["documents:view", "documents:pdf", "customers:view", "projects:view"])
}

export function normalizePermissionSettings(value: unknown, role: UserRole): UserPermissionSetting[] {
  if (role === "owner" || role === "admin") return []

  if (!Array.isArray(value)) {
    return Array.from(getRoleDefaultPermissionKeys(role)).map((key) => ({
      ...splitPermissionKey(key),
      allowed: true
    }))
  }

  const normalized = new Map<string, UserPermissionSetting>()
  for (const item of value) {
    if (typeof item !== "object" || item === null) continue
    const scope = "scope" in item ? String(item.scope ?? "").trim() : ""
    const action = "action" in item ? String(item.action ?? "").trim() : ""
    if (!isKnownPermission(scope, action)) continue
    normalized.set(permissionKey({ scope, action }), {
      scope,
      action,
      allowed: "allowed" in item ? Boolean(item.allowed) : true
    })
  }

  return Array.from(normalized.values())
}

export function getEffectivePermissionKeys(
  role: UserRole,
  permissions: UserPermissionSetting[]
) {
  if (role === "owner" || role === "admin") {
    return getRoleDefaultPermissionKeys(role)
  }

  if (!permissions.length) {
    return getRoleDefaultPermissionKeys(role)
  }

  const keys = new Set<string>()
  for (const permission of permissions) {
    if (permission.allowed) keys.add(permissionKey(permission))
  }

  return keys
}
