import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function GET() {
  try {
    const settings = await prisma.companySettings.findFirst()

    return NextResponse.json(settings ?? {})
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
