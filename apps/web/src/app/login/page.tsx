import { prisma } from "@dream-invoice/database"
import { redirect } from "next/navigation"
import { LoginClient } from "./LoginClient"
import { isDemoMode, isShowcaseMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  if (isShowcaseMode()) {
    redirect("/dashboard")
  }

  if (isDemoMode()) {
    return <LoginClient setupAvailable={false} demoMode />
  }

  const userCount = await prisma.user.count()
  return <LoginClient setupAvailable={userCount === 0} />
}
