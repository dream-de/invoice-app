import { prisma } from "@dream-invoice/database"
import { LoginClient } from "./LoginClient"
import { SETUP_PROTECTED } from "@/lib/auth/config"
import { isDemoMode } from "@/lib/demo-mode"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  if (isDemoMode()) {
    return <LoginClient setupAvailable={false} demoMode />
  }

  const userCount = await prisma.user.count()
  return <LoginClient setupAvailable={!SETUP_PROTECTED && userCount === 0} />
}
