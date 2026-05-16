export type InvoiceStatus =
  | "draft"
  | "sent"
  | "paid"
  | "overdue"
  | "cancelled"

export type InvoiceItem = {
  description: string
  quantity: number
  unitPrice: number
  taxRate: number
}

export type Invoice = {
  id: string
  invoiceNumber: string
  customerId: string
  status: InvoiceStatus
  items: InvoiceItem[]
  createdAt: string
}
