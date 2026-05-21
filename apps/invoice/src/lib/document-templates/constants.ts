import type { DocumentTemplate } from "./types";

export const A4_WIDTH_PX = 794;
export const A4_HEIGHT_PX = 1123;

/**
 * Default-Vorlage für Rechnungen. Diese Vorlage nutzt Platzhalter,
 * die beim Rendern mit Daten aus dem PreviewInvoice ersetzt werden.
 */
export const DEFAULT_INVOICE_TEMPLATE: DocumentTemplate = {
  id: "default-invoice",
  name: "Dream Invoice Standard",
  type: "invoice",
  page: {
    width: A4_WIDTH_PX,
    height: A4_HEIGHT_PX,
  },
  elements: [
    {
        "id": "selectedText",
        "type": "text",
        "x": 104,
        "y": 78,
        "width": 210,
        "height": 28,
        "content": "Neuer Text",
        "fontSize": 14,
        "fontWeight": "bold",
        "color": "#111827",
        "backgroundColor": "transparent"
    },
    {
        "id": "companyName",
        "type": "text",
        "x": 530,
        "y": 72,
        "width": 190,
        "height": 36,
        "content": "Dream Ledger GmbH",
        "fontSize": 23,
        "fontWeight": "bold",
        "align": "right",
        "color": "#111827"
    },
    {
        "id": "senderWindow",
        "type": "box",
        "x": 96,
        "y": 175,
        "width": 340,
        "height": 112,
        "content": "",
        "backgroundColor": "transparent",
        "color": "rgba(248,113,113,0.18)"
    },
    {
        "id": "senderLine",
        "type": "text",
        "x": 96,
        "y": 204,
        "width": 330,
        "height": 18,
        "content": "Dream Ledger GmbH | Lindenallee 42 | 50667 Koeln",
        "fontSize": 8,
        "fontWeight": "normal",
        "color": "#64748b"
    },
    {
        "id": "customerAddress",
        "type": "text",
        "x": 96,
        "y": 232,
        "width": 300,
        "height": 70,
        "content": "{{client.name}}\n{{client.address}}",
        "fontSize": 11,
        "fontWeight": "bold",
        "color": "#111827"
    },
    {
        "id": "invoiceMeta",
        "type": "text",
        "x": 540,
        "y": 218,
        "width": 180,
        "height": 74,
        "content": "Rechnungs-Nr: {{invoice.number}}\nDatum: {{invoice.date}}\nLeistungsdatum: {{invoice.servicePeriod}}\nKunden-Nr: {{client.number}}",
        "fontSize": 10,
        "fontWeight": "normal",
        "align": "right",
        "color": "#111827"
    },
    {
        "id": "title",
        "type": "text",
        "x": 96,
        "y": 455,
        "width": 360,
        "height": 34,
        "content": "Rechnung {{invoice.number}}",
        "fontSize": 20,
        "fontWeight": "bold",
        "color": "#111827"
    },
    {
        "id": "greeting",
        "type": "text",
        "x": 96,
        "y": 512,
        "width": 620,
        "height": 54,
        "content": "Sehr geehrte Damen und Herren,\n\nvielen Dank für Ihren Auftrag. Wir berechnen Ihnen für unsere Leistungen wie folgt:",
        "fontSize": 10,
        "fontWeight": "bold",
        "color": "#111827"
    },
    {
        "id": "itemsTable",
        "type": "table",
        "x": 96,
        "y": 600,
        "width": 620,
        "height": 116
    },
    {
        "id": "totals",
        "type": "text",
        "x": 560,
        "y": 760,
        "width": 156,
        "height": 54,
        "content": "Netto: {{totals.net}}\nUSt (19%): {{totals.vat}}\nGesamtbetrag: {{totals.gross}}",
        "fontSize": 10,
        "fontWeight": "bold",
        "align": "right",
        "color": "#111827"
    },
    {
        "id": "note",
        "type": "text",
        "x": 96,
        "y": 850,
        "width": 620,
        "height": 36,
        "content": "Bitte überweisen Sie den Betrag innerhalb von 14 Tagen ohne Abzug auf das unten genannte Konto.\nEs gelten unsere AGB.",
        "fontSize": 9,
        "fontWeight": "bold",
        "color": "#111827"
    },
    {
        "id": "footerLine",
        "type": "line",
        "x": 96,
        "y": 1014,
        "width": 620,
        "height": 1,
        "backgroundColor": "#e5e7eb"
    },
    {
        "id": "footerCompany",
        "type": "text",
        "x": 96,
        "y": 1038,
        "width": 150,
        "height": 54,
        "content": "Dream Ledger GmbH\nLindenallee 42\n50667 Koeln",
        "fontSize": 8,
        "color": "#64748b"
    },
    {
        "id": "footerContact",
        "type": "text",
        "x": 340,
        "y": 1038,
        "width": 160,
        "height": 64,
        "content": "Kontakt:\nTel: +49 30 1234567\nMail: office@dream-ledger.example\nWeb: www.dream-ledger.example",
        "fontSize": 8,
        "color": "#64748b"
    },
    {
        "id": "footerBank",
        "type": "text",
        "x": 570,
        "y": 1038,
        "width": 160,
        "height": 64,
        "content": "Bankverbindung:\nIBAN: DE12 1005 0000 1234 5678 90\nBIC: BELA DE BE XXX\nUSt-IdNr.: DE123456789",
        "fontSize": 8,
        "color": "#64748b"
    }
]
};
