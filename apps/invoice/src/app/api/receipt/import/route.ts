import { NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      message: "OCR Import ist vorbereitet, aber noch nicht aktiviert."
    },
    { status: 501 }
  )
}
