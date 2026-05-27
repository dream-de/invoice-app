import { requirePagePermission } from "@/lib/auth/permissions"
import ProjectsPageClient from "./ProjectsPageClient"

export const dynamic = "force-dynamic"

export default async function ProjectsPage() {
  await requirePagePermission("projects", "view")
  return <ProjectsPageClient />
}
