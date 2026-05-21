import { demoSnapshot, type DemoDocument, type DemoSnapshot } from "./demo-data";

export type DemoMetricCard = {
  id: string;
  label: string;
  value: string;
  hint: string;
  tone: "neutral" | "success" | "warning" | "danger";
};

export type DemoNavigationItem = {
  href: string;
  label: string;
  badge?: string;
};

export type DemoQuickAction = {
  id: string;
  label: string;
  description: string;
  href: string;
  intent: "primary" | "secondary";
};

export type DemoDashboardView = {
  companyName: string;
  subtitle: string;
  metrics: DemoMetricCard[];
  navigation: DemoNavigationItem[];
  quickActions: DemoQuickAction[];
  recentDocuments: Array<{
    id: string;
    number: string;
    type: DemoDocument["type"];
    customerName: string;
    issueDate: string;
    status: DemoDocument["status"];
    gross: number;
  }>;
  topCustomers: Array<{
    id: string;
    name: string;
    contact: string;
    city: string;
    openAmount: number;
  }>;
};

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function getCustomerName(snapshot: DemoSnapshot, customerId: string) {
  return snapshot.customers.find((customer) => customer.id === customerId)?.name ?? "Demo customer";
}

function getCustomerOpenAmount(snapshot: DemoSnapshot, customerId: string) {
  return snapshot.documents
    .filter((document) => document.customerId === customerId && document.status !== "paid")
    .reduce((sum, document) => sum + document.gross, 0);
}

export function createDemoNavigation(): DemoNavigationItem[] {
  return [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/customers", label: "Customers" },
    { href: "/projects", label: "Projects" },
    { href: "/documents", label: "Documents", badge: String(demoSnapshot.documents.length) },
    { href: "/templates", label: "Templates", badge: String(demoSnapshot.templates.length) },
    { href: "/finance", label: "Finance" },
    { href: "/articles", label: "Articles" },
    { href: "/settings", label: "Settings" },
  ];
}

export function createDemoQuickActions(): DemoQuickAction[] {
  return [
    {
      id: "new-invoice",
      label: "Create invoice",
      description: "Start from the guided demo invoice flow.",
      href: "/documents/new?demo=1",
      intent: "primary",
    },
    {
      id: "new-customer",
      label: "Add customer",
      description: "Open the sample customer form.",
      href: "/customers/new?demo=1",
      intent: "secondary",
    },
    {
      id: "import-finance",
      label: "Import statement",
      description: "Try the finance import preview.",
      href: "/finance/accounts/import?demo=1",
      intent: "secondary",
    },
  ];
}

export function createDemoDashboardView(snapshot: DemoSnapshot = demoSnapshot): DemoDashboardView {
  const paidDocuments = snapshot.documents.filter((document) => document.status === "paid").length;
  const overdueDocuments = snapshot.documents.filter((document) => document.status === "overdue").length;

  return {
    companyName: snapshot.company.name,
    subtitle: "Prepared sample workspace with safe fictional data.",
    metrics: [
      {
        id: "revenue",
        label: "Revenue",
        value: formatCurrency(snapshot.metrics.revenue),
        hint: "Demo year to date",
        tone: "success",
      },
      {
        id: "open",
        label: "Open amount",
        value: formatCurrency(snapshot.metrics.openAmount),
        hint: "Invoices waiting for payment",
        tone: "warning",
      },
      {
        id: "overdue",
        label: "Overdue",
        value: formatCurrency(snapshot.metrics.overdueAmount),
        hint: String(overdueDocuments) + " overdue document" + (overdueDocuments === 1 ? "" : "s"),
        tone: overdueDocuments > 0 ? "danger" : "neutral",
      },
      {
        id: "drafts",
        label: "Drafts",
        value: String(snapshot.metrics.draftDocuments),
        hint: String(paidDocuments) + " paid demo document" + (paidDocuments === 1 ? "" : "s"),
        tone: "neutral",
      },
    ],
    navigation: createDemoNavigation(),
    quickActions: createDemoQuickActions(),
    recentDocuments: [...snapshot.documents]
      .sort((a, b) => b.issueDate.localeCompare(a.issueDate))
      .map((document) => ({
        id: document.id,
        number: document.number,
        type: document.type,
        customerName: getCustomerName(snapshot, document.customerId),
        issueDate: document.issueDate,
        status: document.status,
        gross: document.gross,
      })),
    topCustomers: snapshot.customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      contact: customer.contact,
      city: customer.city,
      openAmount: getCustomerOpenAmount(snapshot, customer.id),
    })),
  };
}
