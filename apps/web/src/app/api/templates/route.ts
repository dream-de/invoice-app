import { promises as fs } from "fs"
import path from "path"
import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { DEFAULT_INVOICE_TEMPLATE } from "@/lib/document-templates/constants"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"

type TemplateRecord = {
  id: string
  name: string
  type: "invoice" | "offer"
  active?: boolean
  updatedAt: string
  data: unknown
}

const DATA_DIR = path.join(process.cwd(), "data")
const FILE_PATH = path.join(DATA_DIR, "templates.json")
const MAX_TEMPLATE_ID_LENGTH = 128
const MAX_TEMPLATE_NAME_LENGTH = 160
const MAX_TEMPLATE_PAYLOAD_BYTES = 100_000

const templatePayloadSchema = z.object({
  id: z.string().trim().min(1).max(MAX_TEMPLATE_ID_LENGTH).optional(),
  name: z.string().trim().min(1).max(MAX_TEMPLATE_NAME_LENGTH).optional(),
  type: z.enum(["invoice", "offer"]).default("invoice"),
  active: z.boolean().optional(),
  data: z.unknown().optional()
}).passthrough()

function authErrorResponse(error: unknown) {
  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  console.error(error)
  return NextResponse.json({ ok: false, error: "Template konnte nicht verarbeitet werden." }, { status: 500 })
}

async function requireTemplateRead() {
  return requireCurrentUser()
}

async function requireTemplateManage() {
  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "templates", "manage")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer Vorlagen.", 403)
  }

  return user
}

function normalizeId(value: unknown) {
  const id = String(value ?? "").trim()
  if (!id) return ""
  if (id.length > MAX_TEMPLATE_ID_LENGTH) {
    throw new AuthServiceError("invalid_request", "Template-ID ist zu lang.", 400)
  }

  return id
}

function assertPayloadSize(value: unknown) {
  const size = Buffer.byteLength(JSON.stringify(value ?? {}), "utf8")
  if (size > MAX_TEMPLATE_PAYLOAD_BYTES) {
    throw new AuthServiceError("invalid_request", "Template-Daten sind zu gross.", 413)
  }
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(FILE_PATH)
  } catch {
    const seed: TemplateRecord[] = [
      {
        id: "default-invoice",
        name: "Dream Invoice Standard",
        type: "invoice",
        active: true,
        updatedAt: new Date().toISOString(),
        data: { ...DEFAULT_INVOICE_TEMPLATE, id: "default-invoice", name: "Dream Invoice Standard" }
      }
    ]
    await fs.writeFile(FILE_PATH, JSON.stringify(seed, null, 2), "utf8")
  }
}

async function readAll(): Promise<TemplateRecord[]> {
  await ensureStore()
  const raw = await fs.readFile(FILE_PATH, "utf8")
  const parsed = JSON.parse(raw)
  return Array.isArray(parsed) ? parsed as TemplateRecord[] : []
}

async function writeAll(items: TemplateRecord[]) {
  await ensureStore()
  const tempPath = path.join(DATA_DIR, "templates." + randomUUID() + ".tmp")
  await fs.writeFile(tempPath, JSON.stringify(items, null, 2), "utf8")
  await fs.rename(tempPath, FILE_PATH)
}

export async function GET(request: Request) {
  try {
    await requireTemplateRead()

    const { searchParams } = new URL(request.url)
    const id = normalizeId(searchParams.get("id"))
    const type = searchParams.get("type")

    if (type && type !== "invoice" && type !== "offer") {
      return NextResponse.json({ ok: false, error: "invalid_type" }, { status: 400 })
    }

    const all = await readAll()

    if (id) {
      const found = all.find((t) => t.id === id)
      if (!found) return NextResponse.json({ error: "not_found" }, { status: 404 })
      return NextResponse.json(found, { status: 200 })
    }

    const list = type ? all.filter((t) => t.type === type) : all
    return NextResponse.json(list, { status: 200 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function POST(request: Request) {
  try {
    await requireTemplateManage()

    const body = await request.json().catch(() => {
      throw new AuthServiceError("invalid_request", "Ungueltige JSON-Anfrage.", 400)
    })
    assertPayloadSize(body)
    const parsed = templatePayloadSchema.safeParse(body)
    if (!parsed.success) {
      throw new AuthServiceError("invalid_request", parsed.error.issues[0]?.message ?? "Ungueltige Template-Daten.", 400)
    }

    const all = await readAll()
    const payload = parsed.data
    const id = normalizeId(payload.id) || "tpl-" + randomUUID().slice(0, 8)
    const now = new Date().toISOString()
    const name = payload.name?.trim() || "Neue Vorlage"

    const incoming: TemplateRecord = {
      id,
      name,
      type: payload.type,
      active: Boolean(payload.active),
      updatedAt: now,
      data: payload.data ?? payload
    }

    const idx = all.findIndex((t) => t.id === id)
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...incoming, updatedAt: now }
    } else {
      all.push(incoming)
    }

    if (incoming.active) {
      for (const t of all) {
        if (t.type === incoming.type && t.id !== incoming.id) t.active = false
      }
    }

    await writeAll(all)
    return NextResponse.json({ ok: true, id }, { status: 200 })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  try {
    await requireTemplateManage()

    const { searchParams } = new URL(request.url)
    const id = normalizeId(searchParams.get("id"))
    if (!id) return NextResponse.json({ error: "missing_id" }, { status: 400 })

    const all = await readAll()
    const next = all.filter((t) => t.id !== id)

    if (next.length === all.length) {
      return NextResponse.json({ error: "not_found" }, { status: 404 })
    }

    await writeAll(next)
    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
