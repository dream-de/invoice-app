import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function GET() {
  const userCount = await prisma.user.count()

  return NextResponse.json({
    ok: true,
    setupAvailable: userCount === 0,
    userCount
  })
}
