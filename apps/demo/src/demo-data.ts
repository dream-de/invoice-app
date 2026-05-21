import demoData from "./demo-data.json";

export type DemoCustomer = {
  id: string;
  name: string;
  contact: string;
  email: string;
  city: string;
  country: string;
  status: "active" | "lead";
};

export type DemoArticle = {
  id: string;
  sku: string;
  title: string;
  category: string;
  unit: string;
  netPrice: number;
  taxRate: number;
};

export type DemoProject = {
  id: string;
  title: string;
  customerId: string;
  status: "planned" | "active" | "completed";
  budget: number;
};

export type DemoDocument = {
  id: string;
  type: "invoice" | "offer" | "delivery" | "credit";
  number: string;
  customerId: string;
  projectId?: string;
  issueDate: string;
  dueDate: string;
  status: "draft" | "sent" | "paid" | "overdue";
  net: number;
  tax: number;
  gross: number;
};

export type DemoBankAccount = {
  id: string;
  name: string;
  iban: string;
  bic: string;
  currency: "EUR" | "USD";
  balance: number;
};

export type DemoSnapshot = {
  company: {
    name: string;
    legalName: string;
    email: string;
    city: string;
    country: string;
    taxId: string;
  };
  metrics: {
    revenue: number;
    openAmount: number;
    overdueAmount: number;
    draftDocuments: number;
  };
  customers: DemoCustomer[];
  articles: DemoArticle[];
  projects: DemoProject[];
  documents: DemoDocument[];
  bankAccounts: DemoBankAccount[];
};

export const demoSnapshot = demoData as DemoSnapshot;
