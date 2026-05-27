import { requirePagePermission } from "@/lib/auth/permissions"
import FinancePageClient from "./FinancePageClient"

export const dynamic = "force-dynamic"

export default async function FinancePage() {
  await requirePagePermission("finance", "view")
  return <FinancePageClient />
}
