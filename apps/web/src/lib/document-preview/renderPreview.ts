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

  const dueDate = invoice.dueDate ?? invoice.date;
  const serviceDate = invoice.serviceDate ?? invoice.date;
  const customerEmail = invoice.customerEmail ?? "billing@aurora-labs.example";
  const customerNumber = invoice.customerNumber ?? "DI-DI-KD-1001";
  const companyName = invoice.companyName ?? "Dream Ledger GmbH";
  const companyStreet = invoice.companyStreet ?? "Lindenallee 42";
  const companyCity = invoice.companyCity ?? "50667 Koeln";
  const companyVatId = invoice.companyVatId ?? "DE123456789";
  const iban = invoice.iban ?? "DE12 1005 0000 1234 5678 90";
  const bic = invoice.bic ?? "BELA DE BE XXX";
  const taxNumber = invoice.taxNumber ?? "12/345/67890";
  const values: Record<string, string> = {
    number: invoice.number,
    date: invoice.date,
    dueDate,
    serviceDate,
    customerName: invoice.customerName,
    customerAddress: invoice.customerAddress,
    customerEmail,
    customerNumber,
    note: invoice.note ?? "",
    net: invoice.totals.net.toFixed(2),
    vat: invoice.totals.vat.toFixed(2),
    gross: invoice.totals.gross.toFixed(2),
    companyName,
    companyStreet,
    companyCity,
    companyVatId,
    iban,
    bic,
    taxNumber,
    "invoice.number": invoice.number,
    "invoice.date": invoice.date,
    "invoice.dueDate": dueDate,
    "invoice.servicePeriod": serviceDate,
    "invoice.serviceDate": serviceDate,
    "client.name": invoice.customerName,
    "client.address": invoice.customerAddress,
    "client.email": customerEmail,
    "client.number": customerNumber,
    "company.name": companyName,
    "company.street": companyStreet,
    "company.city": companyCity,
    "company.vatId": companyVatId,
    "finance.iban": iban,
    "finance.bic": bic,
    "finance.taxNumber": taxNumber,
    "totals.net": invoice.totals.net.toFixed(2),
    "totals.vat": invoice.totals.vat.toFixed(2),
    "totals.gross": invoice.totals.gross.toFixed(2),
  };

  return content.replace(/{{\s*([^{}]+?)\s*}}/g, (_, key: string) => values[key.trim()] ?? "{{" + key + "}}");
}

/**
 * Table‑Elemente werden bei Bedarf in Einzelzeilen umgewandelt.
 */
function renderTable(element: DocumentElement, invoice: PreviewInvoice): DocumentElement[] {
  const headers = invoice.tableHeaders ?? {
    description: "Beschreibung",
    quantity: "Menge",
    unitPrice: "Einzelpreis",
    total: "Gesamt",
  };
  const headerRow: DocumentElement = {
    id: `${element.id}-header`,
    type: "text",
    x: element.x,
    y: element.y,
    width: element.width,
    height: 20,
    content: `${headers.description} | ${headers.quantity} | ${headers.unitPrice} | ${headers.total}`,
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
