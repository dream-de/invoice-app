import { requirePagePermission } from "@/lib/auth/permissions"
import ArticlesPageClient from "./ArticlesPageClient"

export const dynamic = "force-dynamic"

export default async function ArticlesPage() {
  await requirePagePermission("articles", "view")
  return <ArticlesPageClient />
}
