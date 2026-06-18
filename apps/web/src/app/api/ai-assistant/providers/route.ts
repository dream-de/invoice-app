import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

const defaultProviders = [
  { provider: "openai", model: "gpt-5-mini", label: "OpenAI GPT-5 mini", enabled: false, localOnly: false, apiKeyConfigured: false, sortOrder: 1 },
  { provider: "local", model: "local-default", label: "Lokaler Provider", endpoint: "http://localhost:11434", enabled: false, localOnly: true, apiKeyConfigured: false, sortOrder: 2 }
]

export async function GET() {
  try {
    await requireCurrentUser()
    const companySettings = await prisma.companySettings.findFirst({ select: { id: true } })
    const providers = companySettings
      ? await prisma.aiProviderConfig.findMany({ where: { companySettingsId: companySettings.id }, orderBy: { sortOrder: "asc" } })
      : []

    return NextResponse.json({ ok: true, providers: providers.length ? providers : defaultProviders })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}

export async function POST(request: Request) {
  try {
    await requireCurrentUser()
    const data = await request.json().catch(() => ({}))
    const companySettings = await prisma.companySettings.findFirst({ select: { id: true } })

    if (!companySettings) {
      return NextResponse.json({ ok: false, error: "Firmeneinstellungen fehlen." }, { status: 400 })
    }

    const provider = String(data.provider || "").trim() || "openai"
    const model = String(data.model || "").trim() || "gpt-5-mini"
    const config = await prisma.aiProviderConfig.upsert({
      where: { companySettingsId_provider_model: { companySettingsId: companySettings.id, provider, model } },
      create: {
        companySettingsId: companySettings.id,
        provider,
        model,
        label: String(data.label || model).trim(),
        endpoint: data.endpoint ? String(data.endpoint).trim() : null,
        enabled: Boolean(data.enabled),
        localOnly: provider === "local",
        apiKeyConfigured: false
      },
      update: {
        label: String(data.label || model).trim(),
        endpoint: data.endpoint ? String(data.endpoint).trim() : null,
        enabled: Boolean(data.enabled),
        apiKeyConfigured: false
      }
    })

    return NextResponse.json({ ok: true, provider: config })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
