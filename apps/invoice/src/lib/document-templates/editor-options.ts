"use client";

import type { TranslationKey } from "@/i18n/dictionary";
import type { DocumentElement } from "./types";

export const FONT_OPTIONS = [
  { label: "Inter (Modern)", value: "Inter, system-ui, sans-serif" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Helvetica", value: "Helvetica, Arial, sans-serif" },
  { label: "Roboto", value: "Roboto, Arial, sans-serif" },
  { label: "Open Sans", value: "'Open Sans', Arial, sans-serif" },
  { label: "Lato", value: "Lato, Arial, sans-serif" },
  { label: "Montserrat", value: "Montserrat, Arial, sans-serif" },
  { label: "Poppins", value: "Poppins, Arial, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times New Roman", value: "'Times New Roman', Times, serif" },
  { label: "Courier New", value: "'Courier New', Courier, monospace" }
];

export const LAYER_TYPE_ICON: Record<DocumentElement["type"], string> = {
  text: "T",
  table: "▦",
  box: "□",
  line: "−",
  logo: "▧",
  paymentQr: "⌗"
};

export const INVOICE_LAYER_NAMES: Record<string, string> = {
  companyName: "sender_company",
  senderLine: "sender_line",
  customerAddress: "recipient_block",
  invoiceMeta: "invoice_meta",
  title: "invoice_title",
  greeting: "intro_text",
  itemsTable: "items_table",
  totals: "totals_block",
  note: "payment_terms",
  footerCompany: "footer_company",
  footerContact: "footer_contact",
  footerBank: "footer_bank",
  footerLine: "LINE"
};

export const INVOICE_LAYER_NAME_KEYS: Record<string, TranslationKey> = {
  companyName: "templates.editor.layers.name.senderCompany",
  senderLine: "templates.editor.layers.name.senderLine",
  customerAddress: "templates.editor.layers.name.recipientBlock",
  invoiceMeta: "templates.editor.layers.name.invoiceMeta",
  title: "templates.editor.layers.name.invoiceTitle",
  greeting: "templates.editor.layers.name.introText",
  itemsTable: "templates.editor.layers.name.itemsTable",
  totals: "templates.editor.layers.name.totalsBlock",
  note: "templates.editor.layers.name.paymentTerms",
  footerCompany: "templates.editor.layers.name.footerCompany",
  footerContact: "templates.editor.layers.name.footerContact",
  footerBank: "templates.editor.layers.name.footerBank",
  footerLine: "templates.editor.layers.name.line"
};

export const INVOICE_LAYER_Z: Record<string, number> = {
  footerLine: 5
};


type TemplateTranslator = (key: TranslationKey) => string;

export function getInvoiceLayerName(id: string, t: TemplateTranslator): string {
  const key = INVOICE_LAYER_NAME_KEYS[id];
  return key ? t(key) : id;
}

export function getElementTypeLabel(type: DocumentElement["type"] | undefined, t: TemplateTranslator): string {
  if (type === "logo") return t("templates.editor.elementType.image");
  if (type === "paymentQr") return t("templates.editor.elementType.qrcode");
  if (type === "line") return t("templates.editor.elementType.line");
  if (type === "box") return t("templates.editor.elementType.box");
  if (type === "table") return t("templates.editor.elementType.table");
  return t("templates.editor.elementType.text");
}

export type DynamicTokenGroup = {
  title: string;
  tokens: Array<{
    label: string;
    value: string;
  }>;
};

export function createDynamicTokenGroups(t: TemplateTranslator): DynamicTokenGroup[] {
  return [
    { title: t("templates.editor.dynamic.invoice"), tokens: [
      { label: t("templates.editor.dynamic.number"), value: "{{invoice.number}}" },
      { label: t("templates.editor.dynamic.date"), value: "{{invoice.date}}" },
      { label: t("templates.editor.dynamic.dueDate"), value: "{{invoice.dueDate}}" },
      { label: t("templates.editor.dynamic.servicePeriod"), value: "{{invoice.servicePeriod}}" }
    ] },
    { title: t("templates.editor.dynamic.customer"), tokens: [
      { label: t("templates.editor.dynamic.name"), value: "{{client.name}}" },
      { label: t("templates.editor.dynamic.address"), value: "{{client.address}}" },
      { label: t("templates.editor.dynamic.email"), value: "{{client.email}}" },
      { label: t("templates.editor.dynamic.customerNumber"), value: "{{client.number}}" }
    ] },
    { title: t("templates.editor.dynamic.company"), tokens: [
      { label: t("templates.editor.dynamic.name"), value: "{{company.name}}" },
      { label: t("templates.editor.dynamic.street"), value: "{{company.street}}" },
      { label: t("templates.editor.dynamic.city"), value: "{{company.city}}" },
      { label: t("templates.editor.dynamic.vatId"), value: "{{company.vatId}}" }
    ] },
    { title: t("templates.editor.dynamic.finance"), tokens: [
      { label: t("templates.editor.dynamic.iban"), value: "{{finance.iban}}" },
      { label: t("templates.editor.dynamic.bic"), value: "{{finance.bic}}" },
      { label: t("templates.editor.dynamic.taxNumber"), value: "{{finance.taxNumber}}" }
    ] },
    { title: t("templates.editor.dynamic.totals"), tokens: [
      { label: t("templates.editor.dynamic.net"), value: "{{totals.net}}" },
      { label: t("templates.editor.dynamic.vatAmount"), value: "{{totals.vat}}" },
      { label: t("templates.editor.dynamic.gross"), value: "{{totals.gross}}" }
    ] }
  ];
}
