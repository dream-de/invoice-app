import { NextResponse } from "next/server"
import { prisma } from "@invoice-platform/database"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params


try {
    const invoice = await prisma.invoice.update({
      where: { id: id },
      data: { status: "final" }
    })

    return NextResponse.json({ success: true, invoice })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Finalize failed" }, { status: 500 })
  }
}
