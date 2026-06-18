import { NextResponse } from "next/server"
import { prisma } from "@dream-invoice/database"
import { mapAuthError, requireCurrentUser } from "@/lib/auth/service"

export const dynamic = "force-dynamic"

const areaLabels: Record<string, string> = {
  invoices: "Rechnung",
  offers: "Angebot",
  customers: "Kunde",
  projects: "Projekt",
  time: "Zeiterfassung"
}

const taskLabels: Record<string, string> = {
  invoice_text: "Rechnungstext",
  offer_description: "Angebotsbeschreibung",
  reminder: "Mahnungsvorschlag",
  email: "E-Mail-Vorschlag",
  customer_summary: "Kundennotiz-Zusammenfassung"
}

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : ""
}

function joinParts(parts: Array<string | null | undefined>) {
  return parts.map((part) => part?.trim()).filter(Boolean).join("\n")
}

export async function POST(request: Request) {
  try {
    await requireCurrentUser()
    const data = await request.json().catch(() => ({}))
    const area = clean(data.area) || "invoices"
    const task = clean(data.task) || "invoice_text"
    const customerId = clean(data.customerId)
    const projectId = clean(data.projectId)
    const invoiceId = clean(data.invoiceId)
    const articleId = clean(data.articleId)

    const [customer, project, invoice, article] = await Promise.all([
      customerId ? prisma.customer.findUnique({ where: { id: customerId } }) : null,
      projectId ? prisma.project.findUnique({ where: { id: projectId } }) : null,
      invoiceId ? prisma.invoice.findUnique({ where: { id: invoiceId } }) : null,
      articleId ? prisma.article.findUnique({ where: { id: articleId } }) : null
    ])

    const subject = areaLabels[area] || "Vorgang"
    const taskLabel = taskLabels[task] || "Textvorschlag"
    const contextLine = [
      customer ? `Kunde: ${customer.name}` : null,
      project ? `Projekt: ${project.name}` : null,
      article ? `Artikel: ${article.name}` : null,
      invoice ? `Dokument: ${invoice.number} (${invoice.status})` : null
    ].filter(Boolean).join(" · ")
    const userPrompt = clean(data.prompt)

    const draft = joinParts([
      `${taskLabel} fuer ${subject}`,
      contextLine || "Kontext: Allgemeiner DreamInvoice Vorgang",
      "",
      task === "reminder"
        ? `Guten Tag${customer?.contact ? ` ${customer.contact}` : ""},\n\nzu ${invoice?.number ? `unserer Rechnung ${invoice.number}` : "unserer offenen Rechnung"} ist aktuell noch kein Zahlungseingang verbucht. Bitte pruefen Sie den Vorgang und geben Sie uns kurz Rueckmeldung, falls Unterlagen fehlen.\n\nVielen Dank.`
        : task === "offer_description"
          ? `Wir schlagen fuer ${project?.name || "das angefragte Projekt"} eine strukturierte Umsetzung mit klaren Meilensteinen, transparenter Abstimmung und dokumentierten Ergebnissen vor. ${article?.description || "Die Leistungen werden nachvollziehbar beschrieben und koennen direkt in ein Angebot uebernommen werden."}`
          : task === "customer_summary"
            ? `Kurzfassung: ${customer?.notes || "Es liegen noch keine ausfuehrlichen Kundennotizen vor."} Naechster sinnvoller Schritt ist die Pruefung offener Dokumente, Projekte und Kommunikationspunkte.`
            : task === "email"
              ? `Guten Tag,\n\nanbei erhalten Sie einen vorbereiteten Vorschlag zu ${project?.name || invoice?.number || "Ihrem Vorgang"}. Bei Fragen oder Anpassungswuenschen melden Sie sich gern.\n\nFreundliche Gruesse`
              : `Vielen Dank fuer die Zusammenarbeit. Die abgerechneten Leistungen zu ${project?.name || article?.name || "dem vereinbarten Leistungsumfang"} wurden gemaess Vereinbarung erbracht und sind in der Rechnung aufgefuehrt.`,
      userPrompt ? `\nZusatzhinweis: ${userPrompt}` : null,
      "\nHinweis: Provider sind vorbereitet; dieser Entwurf wurde ohne externen API-Key lokal erzeugt."
    ])

    return NextResponse.json({ ok: true, draft, provider: "prepared-local", model: "template-context-v1" })
  } catch (error) {
    const mapped = mapAuthError(error)
    return NextResponse.json({ ok: false, error: mapped.error, code: mapped.code }, { status: mapped.status })
  }
}
