export const userRoles = ["admin", "user"] as const
export type UserRole = (typeof userRoles)[number]

export const userStatuses = ["active", "inactive", "disabled"] as const
export type UserStatus = (typeof userStatuses)[number]

export type AuthUser = {
  id: string
  email: string
  name?: string
  role: UserRole
  status?: UserStatus
}

export function isUserRole(value: string): value is UserRole {
  return userRoles.includes(value as UserRole)
}

export function isUserStatus(value: string): value is UserStatus {
  return userStatuses.includes(value as UserStatus)
}
