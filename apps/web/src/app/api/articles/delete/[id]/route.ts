import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
