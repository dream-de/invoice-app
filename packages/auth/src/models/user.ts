export type UserRole = "owner" | "admin" | "accountant" | "user"

export type AuthUser = {
  id: string
  email: string
  name?: string
  role: UserRole
}
