import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const formData = await request.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "Keine Datei erhalten." },
      { status: 400 }
    )
  }

  return NextResponse.json({
    ok: true,
    message: "Datei wurde angenommen. Echter Import folgt als nächster Schritt.",
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  })
}
