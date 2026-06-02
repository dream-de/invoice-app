import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { recognizeArticlesFromFile } from "@dream-invoice/ocr"
import { AuthServiceError, mapAuthError, requireCurrentUser } from "@/lib/auth/service"
import { hasUserPermission } from "@/lib/auth/permissions"
import { demoModeResponse, isDemoMode } from "@/lib/demo-mode"
import { ImportUploadError, readImportFile, type ImportFileKind } from "@/lib/import/upload"

const ARTICLE_IMPORT_KINDS: ImportFileKind[] = ["text", "csv"]

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

async function requireArticleImportPermission() {
  if (isDemoMode() || !process.env.DATABASE_URL) return

  const user = await requireCurrentUser()
  if (!hasUserPermission(user, "articles", "edit")) {
    throw new AuthServiceError("forbidden", "Keine Berechtigung fuer diesen Import.", 403)
  }
}

export async function POST(request: Request) {
  try {
    await requireArticleImportPermission()
    const { file, formData } = await readImportFile(request, { allowedKinds: ARTICLE_IMPORT_KINDS })
    const save = formData.get("save") === "true"
    const result = await recognizeArticlesFromFile(file)

    if (!save || !result.ok) {
      return NextResponse.json(result, { status: result.ok || result.unsupported ? 200 : 422 })
    }

    if (isDemoMode() || !process.env.DATABASE_URL) {
      return NextResponse.json(demoModeResponse({
        ...result,
        saved: true,
        savedCount: result.ok ? result.articles.length : 0
      }))
    }

    const count = await prisma.article.count()

    const articles = await prisma.$transaction(
      result.articles.map((article, index) =>
        prisma.article.create({
          data: {
            number: article.number || `AR-${String(count + index + 1).padStart(4, "0")}`,
            name: article.name,
            category: article.category || null,
            description: article.description || null,
            unit: article.unit || "Stk",
            netPrice: article.netPrice,
            vatRate: article.vatRate ?? 19
          }
        })
      )
    )

    return NextResponse.json({
      ...result,
      saved: true,
      savedCount: articles.length,
      articles
    })
  } catch (error) {
    const mapped = errorResponse(error)
    if (mapped) return mapped

    console.error("Article import save failed.", error)
    return NextResponse.json(
      { ok: false, error: "Artikelimport konnte nicht verarbeitet werden." },
      { status: 500 }
    )
  }
}
