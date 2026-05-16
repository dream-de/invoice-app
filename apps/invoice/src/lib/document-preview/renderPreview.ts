import type {
  DocumentElement,
  DocumentTemplate,
  PreviewInvoice,
} from "@/lib/document-templates/types";

/**
 * Ersetzt Platzhalter in Textfeldern mit den Werten aus dem PreviewInvoice.
 */
function replacePlaceholders(content: string | undefined, invoice: PreviewInvoice): string {
  if (!content) return "";
  return content
    .replace(/{{number}}/g, invoice.number)
    .replace(/{{date}}/g, invoice.date)
    .replace(/{{customerName}}/g, invoice.customerName)
    .replace(/{{customerAddress}}/g, invoice.customerAddress)
    .replace(/{{note}}/g, invoice.note ?? "")
    .replace(/{{net}}/g, invoice.totals.net.toFixed(2))
    .replace(/{{vat}}/g, invoice.totals.vat.toFixed(2))
    .replace(/{{gross}}/g, invoice.totals.gross.toFixed(2));
}

/**
 * Table‑Elemente werden bei Bedarf in Einzelzeilen umgewandelt.
 */
function renderTable(element: DocumentElement, invoice: PreviewInvoice): DocumentElement[] {
  const headerRow: DocumentElement = {
    id: `${element.id}-header`,
    type: "text",
    x: element.x,
    y: element.y,
    width: element.width,
    height: 20,
    content: "Beschreibung | Menge | Einzelpreis | Gesamt",
    fontSize: 12,
    fontWeight: "bold",
  };
  const rows: DocumentElement[] = invoice.items.map((item, idx) => ({
    id: `${element.id}-row-${idx}`,
    type: "text",
    x: element.x,
    y: element.y + 20 + idx * 20,
    width: element.width,
    height: 20,
    content: `${item.name} | ${item.quantity} | ${item.price.toFixed(2)} | ${item.total.toFixed(2)}`,
    fontSize: 12,
  }));
  return [headerRow, ...rows];
}

/**
 * Rendert alle Elemente einer Vorlage mit den Daten aus einem PreviewInvoice.
 */
export function renderPreviewElements(
  template: DocumentTemplate,
  invoice: PreviewInvoice
): DocumentElement[] {
  const rendered: DocumentElement[] = [];
  for (const element of template.elements) {
    if (element.type === "table") {
      rendered.push(...renderTable(element, invoice));
    } else {
      rendered.push({
        ...element,
        content: replacePlaceholders(element.content, invoice),
      });
    }
  }
  return rendered;
}
