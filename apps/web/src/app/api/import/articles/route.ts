import { NextResponse } from "next/server"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { isDemoMode } from "@/lib/demo-mode"
import { ImportUploadError, readImportFile, type ImportFileKind } from "@/lib/import/upload"
import { recognizeArticlesFromFile } from "@dream-invoice/ocr"

const ARTICLE_IMPORT_KINDS: ImportFileKind[] = ["text", "csv"]


const DOCUMENT_IMPORT_KINDS: ImportFileKind[] = ["text", "csv", "pdf", "image"]

function errorResponse(error: unknown) {
  if (error instanceof ImportUploadError) {
    return NextResponse.json(
      { ok: false, error: error.message, code: error.code },
      { status: error.status }
    )
  }

  if (error instanceof AuthServiceError) {
    const mapped = mapAuthError(error)
    return NextResponse.json(
      { ok: false, error: mapped.error, code: mapped.code },
      { status: mapped.status }
    )
  }

  return null
}

async function requireImportPermission(scope: string, action: string) {
  if (isDemoMode() || !process.env.DATABASE_URL) return

  const user = await requireCurrentUser()
  if (!hasUserPermission(user, scope, action)) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diesen Import.", 403)
  }
}


export async function POST(request: Request) {
  try {
    await requireImportPermission("articles", "edit")
    const { file } = await readImportFile(request, { allowedKinds: ARTICLE_IMPORT_KINDS })
    const result = await recognizeArticlesFromFile(file)
    const status = result.ok || result.unsupported ? 200 : 422

    return NextResponse.json(result, { status })
  } catch (error) {
    const mapped = errorResponse(error)
    if (mapped) return mapped

    console.error("Article import failed.", error)
    return NextResponse.json(
      { ok: false, error: "Artikelimport konnte nicht verarbeitet werden." },
      { status: 500 }
    )
  }
}
