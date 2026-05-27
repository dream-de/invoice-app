import { requirePagePermission } from "@/lib/auth/permissions"
import CustomersPageClient from "./CustomersPageClient"

export const dynamic = "force-dynamic"

export default async function CustomersPage() {
  await requirePagePermission("customers", "view")
  return <CustomersPageClient />
}
