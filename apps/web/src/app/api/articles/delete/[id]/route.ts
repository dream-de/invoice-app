import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({ ok: true }))
    }

    await prisma.article.delete({
      where: { id }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { ok: false, error: "Artikel konnte nicht gelöscht werden." },
      { status: 500 }
    )
  }
}
