import { prisma, type Prisma } from "@dream-invoice/database"
import { articles, customers, documents } from "@/data/invoice-data"

function normalizeCustomerStatus(status: string | undefined) {
  if (status === "inactive") return "inactive"
  return "active"
}

function normalizeDocumentType(type: string) {
  return type === "Angebot" ? "offer" : "invoice"
}

function normalizeDocumentStatus(status: string) {
  if (status === "Bezahlt") return "paid"
  if (status === "Offen") return "open"
  if (status === "Überfällig" || status === "Ueberfaellig") return "overdue"
  return "draft"
}

function grossTotalFor(document: typeof documents[number], netTotal: number) {
  const amount = Number(document.amount)
  return Number.isFinite(amount) && amount > 0 ? amount : netTotal * 1.19
}

export async function seedStarterWorkspace() {
  const [customerCount, invoiceCount, articleCount] = await Promise.all([
    prisma.customer.count(),
    prisma.invoice.count(),
    prisma.article.count()
  ])

  if (customerCount > 0 || invoiceCount > 0 || articleCount > 0) {
    return { seeded: false }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const customerByName = new Map<string, string>()

    for (const [index, customer] of customers.entries()) {
      const created = await tx.customer.create({
        data: {
          number: "KD-" + String(index + 1001).padStart(4, "0"),
          name: customer.name,
          contact: customer.contact,
          email: customer.email,
          country: "Deutschland",
          status: normalizeCustomerStatus(customer.status)
        }
      })

      customerByName.set(customer.name, created.id)
    }

    for (const [index, article] of articles.entries()) {
      await tx.article.create({
        data: {
          number: article.code ?? "AR-" + String(index + 1001),
          name: article.name,
          category: article.category,
          description: article.description,
          unit: article.unit ?? "Stk",
          netPrice: article.price,
          vatRate: article.tax ?? 19,
          active: article.status !== "inactive"
        }
      })
    }

    for (const document of documents) {
      const netTotal = document.items.reduce(
        (sum, item) => sum + Number(item.quantity) * Number(item.netPrice),
        0
      )
      const grossTotal = grossTotalFor(document, netTotal)
      const vatTotal = grossTotal - netTotal

      await tx.invoice.create({
        data: {
          number: document.number,
          type: normalizeDocumentType(document.type),
          status: normalizeDocumentStatus(document.status),
          issueDate: new Date(document.issueDate),
          dueDate: new Date(document.dueDate),
          paidAt: document.status === "Bezahlt" ? new Date(document.dueDate) : null,
          customer: customerByName.has(document.customer)
            ? { connect: { id: customerByName.get(document.customer)! } }
            : undefined,
          netTotal,
          vatTotal,
          grossTotal,
          notes: "Starter-Beispiel fuer die erste Orientierung. Du kannst diese Rechnung bearbeiten oder loeschen.",
          positions: {
            create: document.items.map((item, index) => ({
              title: item.title,
              description: item.description,
              quantity: item.quantity,
              netPrice: item.netPrice,
              vatRate: 19,
              sortOrder: index
            }))
          }
        }
      })
    }

    await tx.numberRange.upsert({
      where: { type: "invoice" },
      create: {
        type: "invoice",
        prefix: "RE-%Y-",
        nextValue: 104,
        padding: 3
      },
      update: {}
    })
  })

  return { seeded: true }
}
