import type { DocumentTemplate } from "./types";

export type TemplateLegalCheckKey =
  | "a4"
  | "customer"
  | "number"
  | "date"
  | "company"
  | "items"
  | "total"
  | "payment";

export interface TemplateLegalCheckResult {
  ok: boolean;
  missing: TemplateLegalCheckKey[];
}

const A4_WIDTH = 794;
const A4_HEIGHT = 1123;

function templateText(template: DocumentTemplate): string {
  return template.elements.map((element) => element.content ?? "").join("\n").toLowerCase();
}

function hasAny(text: string, tokens: string[]): boolean {
  return tokens.some((token) => text.includes(token.toLowerCase()));
}

export function checkTemplateLegalBasics(template: DocumentTemplate): TemplateLegalCheckResult {
  const text = templateText(template);
  const missing: TemplateLegalCheckKey[] = [];

  if (template.page.width !== A4_WIDTH || template.page.height !== A4_HEIGHT) {
    missing.push("a4");
  }

  if (!hasAny(text, ["{{client.name}}", "{{client.address}}", "{{customerName}}", "{{customerAddress}}"])) {
    missing.push("customer");
  }

  if (!hasAny(text, ["{{invoice.number}}", "{{number}}", "angebot nr", "angebots-nr", "rechnungs-nr"])) {
    missing.push("number");
  }

  if (!hasAny(text, ["{{invoice.date}}", "{{date}}", "datum"])) {
    missing.push("date");
  }

  if (!hasAny(text, ["{{company.", "gmbh", "ug", "ag", "firma", "unternehmen", "dream ledger"])) {
    missing.push("company");
  }

  if (!template.elements.some((element) => element.type === "table")) {
    missing.push("items");
  }

  if (!hasAny(text, ["{{totals.gross}}", "{{gross}}", "gesamt", "brutto", "angebotssumme"])) {
    missing.push("total");
  }

  if (template.type === "invoice" && !hasAny(text, ["{{finance.iban}}", "{{finance.bic}}", "iban", "bic", "zahlbar", "zahlung"])) {
    missing.push("payment");
  }

  return { ok: missing.length === 0, missing };
}
