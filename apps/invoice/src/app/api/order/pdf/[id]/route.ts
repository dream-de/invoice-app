import { NextResponse } from "next/server"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  return NextResponse.json(
    {
      ok: false,
      type: "order-pdf",
      id,
      message: "order PDF ist vorbereitet, aber das Datenmodell ist noch nicht aktiviert."
    },
    { status: 501 }
  )
}
