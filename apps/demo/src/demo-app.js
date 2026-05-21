const routes = [
  { id: "dashboard", label: "Dashboard", hash: "#/dashboard" },
  { id: "customers", label: "Customers", hash: "#/customers" },
  { id: "projects", label: "Projects", hash: "#/projects" },
  { id: "documents", label: "Documents", hash: "#/documents" },
  { id: "finance", label: "Finance", hash: "#/finance" },
  { id: "articles", label: "Articles", hash: "#/articles" }
];

const currencyFormatters = new Map();

function formatCurrency(value, currency = "EUR", maximumFractionDigits = 0) {
  const key = currency + ":" + maximumFractionDigits;
  if (!currencyFormatters.has(key)) {
    currencyFormatters.set(
      key,
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits
      })
    );
  }

  return currencyFormatters.get(key).format(value);
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (typeof text === "string") element.textContent = text;
  return element;
}

function createButton(className, label, onClick) {
  const button = createElement("button", className, label);
  button.type = "button";
  button.addEventListener("click", onClick);
  return button;
}

function getRouteId() {
  const route = window.location.hash.replace(/^#\/?/, "") || "dashboard";
  return routes.some((item) => item.id === route) ? route : "dashboard";
}

function findCustomer(snapshot, customerId) {
  return snapshot.customers.find((customer) => customer.id === customerId);
}

function findProject(snapshot, projectId) {
  return snapshot.projects.find((project) => project.id === projectId);
}

function statusLabel(status) {
  return status.replace("-", " ");
}

function showDemoToast(message) {
  const existing = document.querySelector(".demo-toast");
  if (existing) existing.remove();

  const toast = createElement("div", "demo-toast", message);
  document.body.append(toast);
  window.setTimeout(() => toast.remove(), 2400);
}

function createMetric(label, value, hint, tone = "neutral") {
  const card = createElement("article", "metric metric-" + tone);
  card.append(createElement("p", "metric-label", label));
  card.append(createElement("strong", "metric-value", value));
  card.append(createElement("span", "metric-hint", hint));
  return card;
}

function createStatus(status) {
  return createElement("span", "status status-" + status, statusLabel(status));
}

function createSectionHeader(title, description, actionLabel) {
  const header = createElement("div", "section-header");
  const copy = createElement("div", "");
  copy.append(createElement("h2", "", title));
  copy.append(createElement("p", "", description));
  header.append(copy);

  if (actionLabel) {
    header.append(createButton("primary-button small", actionLabel, () => showDemoToast("Demo mode: changes are disabled.")));
  }

  return header;
}

function renderInvoicePreview(snapshot) {
  const invoice = snapshot.documents.find((documentItem) => documentItem.type === "invoice") ?? snapshot.documents[0];
  const customer = findCustomer(snapshot, invoice.customerId);
  const preview = createElement("aside", "invoice-preview");

  const top = createElement("div", "invoice-preview-top");
  top.append(createElement("span", "preview-logo", snapshot.company.name));
  top.append(createElement("span", "preview-number", invoice.number));

  const body = createElement("div", "invoice-preview-body");
  body.append(createElement("p", "preview-label", "Recipient"));
  body.append(createElement("strong", "", customer?.name ?? "Demo customer"));
  body.append(createElement("span", "", customer?.email ?? "demo@example.com"));

  const table = createElement("div", "preview-table");
  for (const row of [
    ["Strategy Workshop", "4", "480"],
    ["Brand Layout Package", "1", "950"]
  ]) {
    const line = createElement("div", "preview-table-row");
    line.append(createElement("span", "", row[0]));
    line.append(createElement("span", "", row[1]));
    line.append(createElement("strong", "", "EUR " + row[2]));
    table.append(line);
  }

  const total = createElement("div", "preview-total");
  total.append(createElement("span", "", "Total"));
  total.append(createElement("strong", "", formatCurrency(invoice.gross)));

  preview.append(top, body, table, total);
  return preview;
}

function renderHeader(activeRoute) {
  const header = createElement("header", "demo-header");
  const brand = createElement("a", "brand");
  brand.href = "#/dashboard";
  brand.append(createElement("span", "brand-mark", "DI"));
  const brandText = createElement("div", "");
  brandText.append(createElement("strong", "", "Dream Invoice"));
  brandText.append(createElement("span", "", "Public demo workspace"));
  brand.append(brandText);

  const nav = createElement("nav", "demo-nav");
  nav.setAttribute("aria-label", "Demo navigation");
  for (const route of routes) {
    const link = createElement("a", route.id === activeRoute ? "active" : "", route.label);
    link.href = route.hash;
    nav.append(link);
  }

  const headerTools = createElement("div", "header-tools");
  headerTools.append(createButton("ghost-button", "Search", () => showDemoToast("Demo search is scoped to fictional records.")));
  headerTools.append(createButton("icon-button", "?", () => showDemoToast("This demo is read-only and reset-safe.")));
  header.append(brand, nav, headerTools);
  return header;
}

function renderNotice() {
  const notice = createElement("section", "demo-notice");
  notice.append(createElement("strong", "", "Public demo mode"));
  notice.append(createElement("span", "", "All records are fictional. Actions are preview-only and do not store private invoice data."));
  return notice;
}

function renderDashboard(snapshot) {
  const fragment = document.createDocumentFragment();
  const hero = createElement("section", "demo-hero");
  const heroCopy = createElement("div", "hero-copy");
  heroCopy.append(createElement("p", "eyebrow", "Dream Invoice Demo"));
  heroCopy.append(createElement("h1", "", snapshot.company.name));
  heroCopy.append(createElement("p", "hero-text", "Explore invoices, customers, articles and finance flows in a polished sample workspace."));

  const quickActions = createElement("div", "quick-actions");
  for (const action of [
    ["Create invoice", "Prepare a demo invoice", "#/documents"],
    ["Add customer", "Open sample customer data", "#/customers"],
    ["Import statement", "Preview finance import", "#/finance"]
  ]) {
    const link = createElement("a", "quick-action");
    link.href = action[2];
    link.append(createElement("strong", "", action[0]));
    link.append(createElement("span", "", action[1]));
    quickActions.append(link);
  }
  heroCopy.append(quickActions);
  hero.append(heroCopy, renderInvoicePreview(snapshot));

  const metrics = createElement("section", "metrics-grid");
  metrics.append(
    createMetric("Revenue", formatCurrency(snapshot.metrics.revenue), "Demo year to date", "success"),
    createMetric("Open amount", formatCurrency(snapshot.metrics.openAmount), "Waiting for payment", "warning"),
    createMetric("Overdue", formatCurrency(snapshot.metrics.overdueAmount), "Needs attention", "danger"),
    createMetric("Drafts", String(snapshot.metrics.draftDocuments), "Prepared documents", "neutral")
  );

  const content = createElement("section", "demo-content");
  const documentsCard = createElement("article", "panel");
  documentsCard.append(createSectionHeader("Recent documents", "Latest invoices and offers from the demo dataset.", "New invoice"));
  documentsCard.append(renderDocumentsList(snapshot, snapshot.documents.slice(0, 4)));

  const customersCard = createElement("article", "panel");
  customersCard.append(createSectionHeader("Demo customers", "Fictional contacts for testing customer flows."));
  customersCard.append(renderCustomersList(snapshot));

  content.append(documentsCard, customersCard);
  fragment.append(hero, metrics, content);
  return fragment;
}

function renderDocumentsList(snapshot, documents) {
  const list = createElement("div", "document-list");
  const sortedDocuments = [...documents].sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  for (const documentItem of sortedDocuments) {
    const customer = findCustomer(snapshot, documentItem.customerId);
    const row = createElement("article", "document-row");
    const main = createElement("div", "");
    main.append(createElement("strong", "", documentItem.number));
    main.append(createElement("span", "", (customer?.name ?? "Demo customer") + " - " + documentItem.issueDate));

    const amount = createElement("div", "document-amount");
    amount.append(createElement("strong", "", formatCurrency(documentItem.gross, "EUR", 2)));
    amount.append(createStatus(documentItem.status));

    row.append(main, amount);
    list.append(row);
  }

  return list;
}

function renderCustomersList(snapshot) {
  const list = createElement("div", "customer-list");

  for (const customer of snapshot.customers) {
    const row = createElement("article", "customer-row");
    const initials = customer.name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();

    row.append(createElement("div", "customer-avatar", initials));

    const copy = createElement("div", "");
    copy.append(createElement("strong", "", customer.name));
    copy.append(createElement("span", "", customer.contact + " - " + customer.city));
    row.append(copy);

    const status = createStatus(customer.status);
    status.classList.add("customer-status");
    row.append(status);
    list.append(row);
  }

  return list;
}

function renderDocumentsPage(snapshot) {
  const section = createElement("section", "page-grid single");
  const panel = createElement("article", "panel");
  panel.append(createSectionHeader("Documents", "Read-only invoices, offers and draft documents prepared for the demo.", "Create demo document"));
  panel.append(renderDocumentsList(snapshot, snapshot.documents));
  section.append(panel);
  return section;
}

function renderCustomersPage(snapshot) {
  const section = createElement("section", "page-grid single");
  const panel = createElement("article", "panel");
  panel.append(createSectionHeader("Customers", "Fictional Metropolis and Koeln sample customers.", "Add demo customer"));
  panel.append(renderCustomersList(snapshot));
  section.append(panel);
  return section;
}

function renderProjectsPage(snapshot) {
  const section = createElement("section", "page-grid single");
  const panel = createElement("article", "panel");
  panel.append(createSectionHeader("Projects", "Project structures connected to customers and documents.", "New project"));

  const list = createElement("div", "data-list");
  for (const project of snapshot.projects) {
    const customer = findCustomer(snapshot, project.customerId);
    const row = createElement("article", "data-row");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", project.title));
    copy.append(createElement("span", "", (customer?.name ?? "Demo customer") + " - " + statusLabel(project.status)));
    row.append(copy, createElement("strong", "row-value", formatCurrency(project.budget)));
    list.append(row);
  }

  panel.append(list);
  section.append(panel);
  return section;
}

function renderFinancePage(snapshot) {
  const section = createElement("section", "page-grid");
  const accounts = createElement("article", "panel");
  accounts.append(createSectionHeader("Finance", "Demo bank accounts and import preview without real banking data.", "Import statement"));

  const list = createElement("div", "data-list");
  for (const account of snapshot.bankAccounts) {
    const row = createElement("article", "data-row");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", account.name));
    copy.append(createElement("span", "", account.iban + " - " + account.bic));
    row.append(copy, createElement("strong", "row-value", formatCurrency(account.balance, account.currency)));
    list.append(row);
  }

  accounts.append(list);

  const safety = createElement("article", "panel panel-dark");
  safety.append(createElement("h2", "", "Safe import mode"));
  safety.append(createElement("p", "", "CSV and bank import flows are represented with fictional balances only. No connector, bank login or upload target is active in the public demo."));
  safety.append(createButton("primary-button", "Preview import flow", () => showDemoToast("Demo mode: file uploads are disabled.")));

  section.append(accounts, safety);
  return section;
}

function renderArticlesPage(snapshot) {
  const section = createElement("section", "page-grid single");
  const panel = createElement("article", "panel");
  panel.append(createSectionHeader("Articles", "Reusable sample services and products for invoice testing.", "Add article"));

  const list = createElement("div", "data-list");
  for (const article of snapshot.articles) {
    const row = createElement("article", "data-row");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", article.title));
    copy.append(createElement("span", "", article.sku + " - " + article.category + " - " + article.unit));
    row.append(copy, createElement("strong", "row-value", formatCurrency(article.netPrice, "EUR", 2)));
    list.append(row);
  }

  panel.append(list);
  section.append(panel);
  return section;
}

function renderRoute(snapshot, routeId) {
  if (routeId === "customers") return renderCustomersPage(snapshot);
  if (routeId === "projects") return renderProjectsPage(snapshot);
  if (routeId === "documents") return renderDocumentsPage(snapshot);
  if (routeId === "finance") return renderFinancePage(snapshot);
  if (routeId === "articles") return renderArticlesPage(snapshot);
  return renderDashboard(snapshot);
}

function renderDemo(snapshot) {
  const app = document.querySelector("#app");
  if (!app) return;

  const routeId = getRouteId();
  app.textContent = "";
  app.append(renderHeader(routeId), renderNotice(), renderRoute(snapshot, routeId));
}

async function loadSnapshot() {
  const response = await fetch("./src/demo-data.json", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Demo data could not be loaded.");
  }

  return response.json();
}

async function boot() {
  const snapshot = await loadSnapshot();
  renderDemo(snapshot);
  window.addEventListener("hashchange", () => renderDemo(snapshot));
}

boot().catch((error) => {
  const app = document.querySelector("#app");
  if (app) {
    app.textContent = "";
    const message = createElement("main", "demo-loading");
    message.append(createElement("p", "", error.message));
    app.append(message);
  }
});
