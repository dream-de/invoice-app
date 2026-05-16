import type { AuthUser, UserRole } from "../models/user"

export function hasRole(user: AuthUser, roles: UserRole[]): boolean {
  return roles.includes(user.role)
}

export function isAdmin(user: AuthUser): boolean {
  return hasRole(user, ["owner", "admin"])
}
