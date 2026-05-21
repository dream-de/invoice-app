import { demoSnapshot } from "./demo-data";

export * from "./demo-data";
export * from "./demo-view-model";

export const DEMO_APP_NAME = "Dream Invoice Demo";
export const DEMO_MODE_STORAGE_KEY = "dream-invoice-demo-mode";

export function createDemoSnapshot() {
  return structuredClone(demoSnapshot);
}

export function getDemoDocumentById(id: string) {
  return demoSnapshot.documents.find((document) => document.id === id);
}

export function getDemoCustomerById(id: string) {
  return demoSnapshot.customers.find((customer) => customer.id === id);
}

export function describeDemoDataset() {
  return {
    appName: DEMO_APP_NAME,
    customers: demoSnapshot.customers.length,
    articles: demoSnapshot.articles.length,
    projects: demoSnapshot.projects.length,
    documents: demoSnapshot.documents.length,
    bankAccounts: demoSnapshot.bankAccounts.length,
  };
}
