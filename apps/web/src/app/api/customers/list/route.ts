import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function GET() {
  try {
    const customers = await prisma.customer.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Kunden konnten nicht geladen werden." },
      { status: 500 }
    )
  }
}
