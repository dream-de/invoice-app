import type { TranslationKey } from "@/i18n/dictionary";
import type { PreviewInvoice } from "./types";

type TemplateTranslator = (key: TranslationKey) => string;

export function createTemplatePreviewInvoice(t: TemplateTranslator): PreviewInvoice {
  return {
    number: t("templates.editor.preview.number"),
    date: t("templates.editor.preview.date"),
    customerName: t("templates.editor.preview.customerName"),
    customerAddress: t("templates.editor.preview.customerAddress"),
    customerEmail: t("templates.editor.preview.customerEmail"),
    customerNumber: t("templates.editor.preview.customerNumber"),
    companyName: t("templates.editor.preview.companyName"),
    companyStreet: t("templates.editor.preview.companyStreet"),
    companyCity: t("templates.editor.preview.companyCity"),
    companyVatId: t("templates.editor.preview.companyVatId"),
    iban: t("templates.editor.preview.iban"),
    bic: t("templates.editor.preview.bic"),
    taxNumber: t("templates.editor.preview.taxNumber"),
    note: t("templates.editor.preview.note"),
    tableHeaders: {
      description: t("templates.editor.preview.table.description"),
      quantity: t("templates.editor.preview.table.quantity"),
      unitPrice: t("templates.editor.preview.table.unitPrice"),
      total: t("templates.editor.preview.table.total"),
    },
    items: [
      { name: t("templates.editor.preview.item.consulting"), quantity: 4, price: 100, total: 400 },
      { name: t("templates.editor.preview.item.development"), quantity: 10, price: 100, total: 1000 },
    ],
    totals: { net: 1400, vat: 266, gross: 1666 },
  };
}
