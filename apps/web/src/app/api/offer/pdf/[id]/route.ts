import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const target = new URL(`/api/invoice/pdf/${id}`, req.url)
  target.search = new URL(req.url).search
  return NextResponse.redirect(target, 307)
}
