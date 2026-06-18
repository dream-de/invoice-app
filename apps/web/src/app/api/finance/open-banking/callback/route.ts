import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { writeAuditLog } from "@/lib/audit/log"
import { FINAPI_PROVIDER, authErrorResponse, publicConnection, requireOpenBankingAdmin } from "../_shared"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const user = await requireOpenBankingAdmin()
    const url = new URL(request.url)
    const connectionId = url.searchParams.get("connectionId")
    const status = url.searchParams.get("status") || "callback_prepared"

    if (!connectionId) {
      return NextResponse.json({ ok: false, error: "connectionId fehlt." }, { status: 400 })
    }

    const connection = await prisma.bankConnection.update({
      where: { id: connectionId },
      data: {
        provider: FINAPI_PROVIDER,
        status: status === "connected" ? "connected" : "callback_prepared",
        consentStatus: "prepared",
        connectedAt: status === "connected" ? new Date() : undefined,
        auditState: "callback_received"
      }
    })

    await writeAuditLog({
      action: "open_banking.connection_callback",
      entity: "BankConnection",
      entityId: connection.id,
      reason: "finAPI callback prepared",
      data: { provider: FINAPI_PROVIDER, userId: user.id, status: connection.status, tokensExposed: false }
    })

    return NextResponse.json({ ok: true, connection: publicConnection(connection) })
  } catch (error) {
    const authError = authErrorResponse(error)
    if (authError) return authError
    console.error("Open banking callback failed.", error)
    return NextResponse.json({ ok: false, error: "finAPI Callback konnte nicht verarbeitet werden." }, { status: 500 })
  }
}
