import { NextResponse } from "next/server"
import { recognizePositionsFromFile } from "@dream-invoice/ocr"

export const runtime = "nodejs"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, error: "Keine Datei erhalten." },
      { status: 400 }
    )
  }

  const result = await recognizePositionsFromFile(file)
  const status = result.ok || result.unsupported ? 200 : 422

  return NextResponse.json(result, { status })
}
