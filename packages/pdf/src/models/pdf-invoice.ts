export type PdfInvoiceData = {
  invoiceNumber: string
  customerName: string
  issueDate?: string
  dueDate?: string
  totalNet?: number
  totalTax?: number
  totalGross: number
}
