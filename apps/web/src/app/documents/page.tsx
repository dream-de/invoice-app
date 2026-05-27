import { requirePagePermission } from "@/lib/auth/permissions"
import DocumentsPageClient from "./DocumentsPageClient"

export const dynamic = "force-dynamic"

export default async function DocumentsPage() {
  await requirePagePermission("documents", "view")
  return <DocumentsPageClient />
}
