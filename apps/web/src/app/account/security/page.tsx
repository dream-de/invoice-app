import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default function AccountSecurityPage() {
  redirect("/dashboard-v2/account/security")
}
