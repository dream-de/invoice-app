export type DocumentElementType = "text" | "box" | "line" | "table" | "logo" | "paymentQr";

export interface DocumentElement {
  id: string;
  type: DocumentElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  content?: string;
  fontSize?: number;
  fontWeight?: "normal" | "bold" | "black";
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  align?: "left" | "center" | "right";
  borderColor?: string;
  borderWidth?: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: "invoice" | "offer";
  page: {
    width: number;
    height: number;
  };
  elements: DocumentElement[];
}

/**
 * Ein einzelnes Item in der Vorschau‑Rechnung (oder Angebot).
 */
export interface PreviewItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

/**
 * Datenstruktur für ein Dokument zur Vorschau.
 */
export interface PreviewInvoice {
  number: string;
  date: string;
  dueDate?: string;
  serviceDate?: string;
  customerName: string;
  customerAddress: string;
  customerEmail?: string;
  customerNumber?: string;
  companyName?: string;
  companyStreet?: string;
  companyCity?: string;
  companyVatId?: string;
  iban?: string;
  bic?: string;
  taxNumber?: string;
  note?: string;
  tableHeaders?: {
    description: string;
    quantity: string;
    unitPrice: string;
    total: string;
  };
  items: PreviewItem[];
  totals: {
    net: number;
    vat: number;
    gross: number;
  };
}
