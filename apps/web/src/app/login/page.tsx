import { prisma } from "@dream-invoice/database"
import { LoginClient } from "./LoginClient"

export const dynamic = "force-dynamic"

export default async function LoginPage() {
  const userCount = await prisma.user.count()
  return <LoginClient setupAvailable={userCount === 0} />
}
