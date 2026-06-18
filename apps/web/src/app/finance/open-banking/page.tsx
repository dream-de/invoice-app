import { requirePagePermission } from "@/lib/auth/permissions"
import { OpenBankingClient } from "./OpenBankingClient"

export const dynamic = "force-dynamic"

export default async function OpenBankingPage() {
  await requirePagePermission("finance", "view")
  return <OpenBankingClient />
}
