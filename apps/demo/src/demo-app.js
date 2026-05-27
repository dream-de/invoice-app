const routes = [
  { id: "dashboard", label: "Dashboard", hash: "#/dashboard" },
  { id: "customers", label: "Customers", hash: "#/customers" },
  { id: "projects", label: "Projects", hash: "#/projects" },
  { id: "documents", label: "Documents", hash: "#/documents" },
  { id: "templates", label: "Templates", hash: "#/templates" },
  { id: "finance", label: "Finance", hash: "#/finance" },
  { id: "articles", label: "Articles", hash: "#/articles" },
  { id: "settings", label: "Settings", hash: "#/settings" }
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

function createLinkButton(className, label, hash) {
  const link = createElement("a", className, label);
  link.href = hash;
  return link;
}

function showReadOnlyAction(action) {
  showDemoToast(action + " is preview-only in the public demo.");
}

function getRouteParts() {
  const rawRoute = window.location.hash.replace(/^#\/?/, "") || "dashboard";
  const [routeId, detailId] = rawRoute.split("/");
  const activeRoute = routes.some((item) => item.id === routeId) ? routeId : "dashboard";
  return {
    activeRoute,
    detailId: activeRoute === "documents" ? detailId : undefined
  };
}

function getRouteId() {
  return getRouteParts().activeRoute;
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

function formatDate(value) {
  return new Intl.DateTimeFormat("de-DE").format(new Date(value + "T12:00:00"));
}

function paymentMethodLabel(method) {
  if (method === "Bankueberweisung") return "Bankueberweisung";
  return method;
}

function getDocumentPositions(documentItem) {
  if (Array.isArray(documentItem.positions) && documentItem.positions.length > 0) {
    return documentItem.positions;
  }

  return [
    {
      id: documentItem.id + "-fallback-position",
      title: documentItem.type === "offer" ? "Demo offer package" : "Demo invoice service",
      description: "Preview-only sample position",
      quantity: 1,
      netPrice: documentItem.net,
      total: documentItem.net
    }
  ];
}

function getDocumentPayments(documentItem) {
  return Array.isArray(documentItem.payments) ? documentItem.payments : [];
}

function getDocumentNote() {
  return "Vielen Dank fuer Ihren Auftrag. Bitte ueberweisen Sie den faelligen Betrag innerhalb von 14 Tagen auf das unten angegebene Konto.";
}

function closeDemoModal() {
  const existing = document.querySelector(".demo-modal-backdrop");
  if (existing) existing.remove();
  document.body.classList.remove("demo-modal-open");
}

function showDemoModal(modal) {
  closeDemoModal();

  const backdrop = createElement("div", "demo-modal-backdrop");
  backdrop.addEventListener("click", (event) => {
    if (event.target === backdrop) closeDemoModal();
  });

  backdrop.append(modal);
  document.body.append(backdrop);
  document.body.classList.add("demo-modal-open");
}

function createModalShell(title, icon) {
  const modal = createElement("section", "demo-modal");
  modal.setAttribute("role", "dialog");
  modal.setAttribute("aria-modal", "true");

  const header = createElement("div", "demo-modal-header");
  const heading = createElement("div", "demo-modal-title");
  heading.append(createElement("span", "demo-modal-icon", icon));
  heading.append(createElement("h2", "", title));
  header.append(heading, createButton("demo-modal-close", "x", closeDemoModal));

  const body = createElement("div", "demo-modal-body");
  const footer = createElement("div", "demo-modal-footer");
  modal.append(header, body, footer);
  return { modal, body, footer };
}

function createField(label, value, tag = "input") {
  const wrapper = createElement("label", "demo-field");
  wrapper.append(createElement("span", "", label));
  const input = createElement(tag, "demo-input");
  input.value = value;
  wrapper.append(input);
  return wrapper;
}

function showEmailModal(documentItem, customer) {
  const { modal, body, footer } = createModalShell("Per E-Mail senden", "mail");
  const recipient = customer?.email ?? "demo-recipient@example";
  const documentType = documentItem.type === "offer" ? "Angebot" : "Rechnung";

  body.append(
    createField("Empfaenger", recipient),
    createField("Betreff", documentType + " " + documentItem.number),
    createField(
      "Nachricht",
      "Sehr geehrte Damen und Herren,\n\nanbei erhalten Sie Ihre " + documentType.toLowerCase() + " " + documentItem.number + ".\n\nMit freundlichen Gruessen,\nDream Invoice Studio",
      "textarea"
    )
  );

  const attachment = createElement("div", "attachment-pill");
  attachment.append(createElement("span", "", "paperclip"));
  attachment.append(createElement("strong", "", "Angehaengt: " + documentItem.number + ".pdf"));
  body.append(attachment);

  footer.append(
    createButton("secondary-button", "Abbrechen", closeDemoModal),
    createButton("primary-button", "Senden", () => {
      closeDemoModal();
      showDemoToast("Demo mode: email sending is simulated.");
    })
  );

  showDemoModal(modal);
}

function showPaymentModal(documentItem, payment) {
  const { modal, body, footer } = createModalShell(payment ? "Zahlung bearbeiten" : "Zahlung erfassen", "eur");
  const methodWrapper = createElement("label", "demo-field");
  methodWrapper.append(createElement("span", "", "Methode"));
  const select = createElement("select", "demo-input");
  for (const method of ["Bankueberweisung", "PayPal", "Karte", "Bar", "Sonstiges"]) {
    const option = createElement("option", "", paymentMethodLabel(method));
    option.value = method;
    if ((payment?.method ?? "Bankueberweisung") === method) option.selected = true;
    select.append(option);
  }
  methodWrapper.append(select);

  const row = createElement("div", "demo-modal-two");
  row.append(
    createField("Datum", formatDate(payment?.date ?? documentItem.issueDate)),
    createField("Betrag (EUR)", String(payment?.amount ?? documentItem.gross))
  );

  body.append(
    row,
    methodWrapper,
    createField("Grund (Pflicht)", payment?.reason ?? "z.B. Zahlungseingang Kontoauszug, Teilzahlung, ...", "textarea")
  );

  footer.append(
    createButton("secondary-button", "Abbrechen", closeDemoModal),
    createButton("primary-button", "Speichern", () => {
      closeDemoModal();
      showDemoToast("Demo mode: payment changes are simulated.");
    })
  );

  showDemoModal(modal);
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
  headerTools.append(createButton("ghost-button", "Reset demo", () => showDemoToast("Demo reset complete. No private data is stored.")));
  headerTools.append(createButton("icon-button", "?", () => showDemoToast("This demo is read-only and reset-safe.")));
  header.append(brand, nav, headerTools);
  return header;
}

function renderNotice() {
  const notice = createElement("section", "demo-notice");
  notice.append(createElement("strong", "", "Public demo mode"));
  notice.append(createElement("span", "", "All records are fictional. Create, import, email and export actions are simulated safely."));
  notice.append(createButton("notice-action", "How it works", () => showDemoToast("Explore workflows freely. Changes are not persisted.")));
  return notice;
}

function renderWorkflowGuide() {
  const guide = createElement("section", "workflow-guide");
  const header = createElement("div", "workflow-header");
  header.append(createElement("p", "eyebrow", "Guided demo"));
  header.append(createElement("h2", "", "Try the core Dream Invoice flows"));
  header.append(createElement("span", "", "Preview the real product path without writing data, sending email or touching bank connections."));
  guide.append(header);

  const steps = createElement("div", "workflow-steps");
  for (const step of [
    ["1", "Review customers", "Open fictional customer records and linked projects.", "#/customers"],
    ["2", "Prepare invoice", "Walk through documents and template previews safely.", "#/documents"],
    ["3", "Check finance", "Inspect demo accounts and statement-import messaging.", "#/finance"],
    ["4", "Reset anytime", "Return to the same clean demo state after every visit.", "#/settings"]
  ]) {
    const card = createElement("a", "workflow-step");
    card.href = step[3];
    card.append(createElement("span", "workflow-number", step[0]));
    card.append(createElement("strong", "", step[1]));
    card.append(createElement("small", "", step[2]));
    steps.append(card);
  }

  guide.append(steps);
  return guide;
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
    ["Edit template", "Preview safe templates", "#/templates"],
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

  const workflow = renderWorkflowGuide();

  const content = createElement("section", "demo-content");
  const documentsCard = createElement("article", "panel");
  documentsCard.append(createSectionHeader("Recent documents", "Latest invoices and offers from the demo dataset.", "New invoice"));
  documentsCard.append(renderDocumentsList(snapshot, snapshot.documents.slice(0, 4)));

  const customersCard = createElement("article", "panel");
  customersCard.append(createSectionHeader("Demo customers", "Fictional contacts for testing customer flows."));
  customersCard.append(renderCustomersList(snapshot));

  content.append(documentsCard, customersCard);
  fragment.append(hero, metrics, workflow, content);
  return fragment;
}

function renderDocumentsList(snapshot, documents) {
  const list = createElement("div", "document-list");
  const sortedDocuments = [...documents].sort((a, b) => b.issueDate.localeCompare(a.issueDate));

  for (const documentItem of sortedDocuments) {
    const customer = findCustomer(snapshot, documentItem.customerId);
    const row = createElement("article", "document-row");
    const project = documentItem.projectId ? findProject(snapshot, documentItem.projectId) : null;
    const main = createElement("div", "");
    main.append(createElement("strong", "", documentItem.number));
    main.append(createElement("span", "", (customer?.name ?? "Demo customer") + " - " + documentItem.issueDate));
    if (project) main.append(createElement("small", "row-meta", project.title));

    const amount = createElement("div", "document-amount");
    amount.append(createElement("strong", "", formatCurrency(documentItem.gross, "EUR", 2)));
    amount.append(createStatus(documentItem.status));
    amount.append(createLinkButton("text-action", "Preview", "#/documents/" + documentItem.id));

    row.append(main, amount);
    list.append(row);
  }

  return list;
}

function renderDocumentDetailPage(snapshot, documentId) {
  const documentItem = snapshot.documents.find((item) => item.id === documentId);
  if (!documentItem) return renderDocumentsPage(snapshot);

  const customer = findCustomer(snapshot, documentItem.customerId);
  const positions = getDocumentPositions(documentItem);
  const payments = getDocumentPayments(documentItem);
  const paidAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const openAmount = Math.max(documentItem.gross - paidAmount, 0);
  const progress = documentItem.gross > 0 ? Math.min((paidAmount / documentItem.gross) * 100, 100) : 0;

  const page = createElement("section", "document-detail-shell");
  const header = createElement("article", "detail-header panel");
  const headerCopy = createElement("div", "");
  headerCopy.append(createLinkButton("back-link", "Zurueck zu Dokumenten", "#/documents"));
  headerCopy.append(createElement("h1", "", documentItem.number));
  headerCopy.append(createElement("p", "", (documentItem.type === "offer" ? "Angebot" : "Rechnung") + " - " + (customer?.name ?? "Demo customer")));

  const actions = createElement("div", "detail-actions");
  actions.append(
    createButton("detail-button", "Bearbeiten", () => showReadOnlyAction("Document edit")),
    createButton("detail-button accent", "Senden", () => showEmailModal(documentItem, customer)),
    createButton("detail-button", "Drucken", () => showReadOnlyAction("Print")),
    createButton("detail-button", "Teilen", () => showReadOnlyAction("Share")),
    createButton("detail-button accent", "Download", () => showReadOnlyAction("PDF download"))
  );
  header.append(headerCopy, actions);

  const grid = createElement("div", "detail-grid");
  const leftColumn = createElement("div", "detail-column");
  const rightColumn = createElement("aside", "detail-column");

  const facts = createElement("article", "detail-card");
  facts.append(createElement("h2", "", "Dokumentdaten"));
  facts.append(createElement("p", "", "Empfaenger, Datum und Zahlungsinformationen."));
  const factGrid = createElement("div", "document-facts");
  for (const [label, value] of [
    ["Empfaenger", customer?.name ?? "Unbekannt"],
    ["Datum", formatDate(documentItem.issueDate)],
    ["Faellig", documentItem.dueDate ? formatDate(documentItem.dueDate) : "-"]
  ]) {
    const fact = createElement("div", "fact-card");
    fact.append(createElement("span", "", label), createElement("strong", "", value));
    factGrid.append(fact);
  }
  facts.append(factGrid);

  const positionsCard = createElement("article", "detail-card");
  positionsCard.append(createElement("h2", "", "Positionen"));
  positionsCard.append(createElement("p", "", "Leistungen und Betraege."));
  const positionsTable = createElement("div", "positions-table");
  const tableHeader = createElement("div", "position-row position-head");
  tableHeader.append(createElement("span", "", "Beschreibung"), createElement("span", "", "Betrag"));
  positionsTable.append(tableHeader);
  for (const position of positions) {
    const row = createElement("div", "position-row");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", position.title));
    copy.append(createElement("small", "", position.description ?? (position.quantity + " x " + formatCurrency(position.netPrice, "EUR", 2))));
    row.append(copy, createElement("strong", "", formatCurrency(position.total, "EUR", 2)));
    positionsTable.append(row);
  }
  positionsCard.append(positionsTable);

  const noteTotals = createElement("div", "note-total-grid");
  const note = createElement("div", "document-note");
  note.append(createElement("strong", "", "Hinweis"));
  note.append(createElement("p", "", getDocumentNote()));
  const totals = createElement("div", "totals-card");
  for (const [label, value] of [
    ["Netto", documentItem.net],
    ["MwSt 19%", documentItem.tax],
    ["Gesamt", documentItem.gross]
  ]) {
    const row = createElement("div", label === "Gesamt" ? "total-row-detail grand" : "total-row-detail");
    row.append(createElement("span", "", label), createElement("strong", "", formatCurrency(value, "EUR", 2)));
    totals.append(row);
  }
  noteTotals.append(note, totals);
  positionsCard.append(noteTotals);

  leftColumn.append(facts, positionsCard);

  const statusCard = createElement("article", "detail-card status-detail");
  statusCard.append(createElement("h2", "", "Status"));
  statusCard.append(createElement("p", "", "Aktueller Dokumentstatus."));
  if (documentItem.status === "overdue") {
    const warning = createElement("div", "status-alert");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", "Zahlung ueberfaellig"));
    copy.append(createButton("status-alert-action", "Mahnung erstellen", () => showReadOnlyAction("Reminder")));
    warning.append(createElement("span", "", "!"), copy);
    statusCard.append(warning);
  }
  const statusLine = createElement("div", "status-line");
  statusLine.append(createStatus(documentItem.status));
  statusLine.append(createElement("span", "", documentItem.status === "paid" ? "Bezahlt am " + formatDate(payments[0]?.date ?? documentItem.issueDate) : "Beim Kunden angekommen"));
  statusCard.append(statusLine);

  const paymentsCard = createElement("article", "detail-card payments-card");
  const paymentsHeader = createElement("div", "compact-card-header");
  paymentsHeader.append(createElement("h2", "", "Zahlungen"));
  paymentsHeader.append(createButton("detail-button small", "+ Zahlung", () => showPaymentModal(documentItem)));
  paymentsCard.append(paymentsHeader);
  const paymentSummary = createElement("div", "payment-summary");
  for (const [label, value] of [
    ["Bezahlt", paidAmount],
    ["Noch offen", openAmount]
  ]) {
    const line = createElement("div", "");
    line.append(createElement("span", "", label), createElement("strong", "", formatCurrency(value, "EUR", 2)));
    paymentSummary.append(line);
  }
  const bar = createElement("div", "payment-bar");
  const fill = createElement("span", "payment-progress");
  fill.style.width = progress + "%";
  bar.append(fill);
  paymentsCard.append(paymentSummary, bar);

  if (payments.length > 0) {
    for (const payment of payments) {
      const paymentRow = createElement("div", "payment-entry");
      const paymentCopy = createElement("div", "");
      paymentCopy.append(createElement("strong", "", formatDate(payment.date)));
      paymentCopy.append(createElement("span", "", paymentMethodLabel(payment.method).toUpperCase()));
      const paymentActions = createElement("div", "payment-actions");
      paymentActions.append(
        createElement("strong", "", formatCurrency(payment.amount, "EUR", 2)),
        createButton("round-action", "edit", () => showPaymentModal(documentItem, payment)),
        createButton("round-action danger", "delete", () => showReadOnlyAction("Delete payment"))
      );
      paymentRow.append(paymentCopy, paymentActions);
      paymentsCard.append(paymentRow);
    }
  } else {
    paymentsCard.append(createElement("div", "empty-payment", "Noch keine Zahlung erfasst."));
  }

  const noteCard = createElement("article", "detail-card internal-note");
  noteCard.append(createElement("h2", "", "Interne Notiz"));
  const noteInput = createElement("textarea", "note-input");
  noteInput.placeholder = "Notiz zu diesem Vorgang...";
  noteCard.append(noteInput);

  const historyCard = createElement("article", "detail-card history-card");
  historyCard.append(createElement("h2", "", "Verlauf"));
  const history = createElement("ul", "history-list");
  for (const item of [
    [formatDate(documentItem.issueDate), documentItem.type === "offer" ? "Angebot erstellt" : "Rechnung erstellt"],
    [formatDate(documentItem.issueDate), "Per E-Mail vorbereitet"],
    [payments[0] ? formatDate(payments[0].date) : formatDate(documentItem.dueDate), documentItem.status === "paid" ? "Zahlung vollstaendig erhalten" : "Status aktualisiert"]
  ]) {
    const row = createElement("li", "");
    row.append(createElement("span", "", item[0]), createElement("strong", "", item[1]));
    history.append(row);
  }
  historyCard.append(history);

  rightColumn.append(statusCard, paymentsCard, noteCard, historyCard);
  grid.append(leftColumn, rightColumn);
  page.append(header, grid);
  return page;
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

    const actions = createElement("div", "customer-actions");
    const status = createStatus(customer.status);
    status.classList.add("customer-status");
    actions.append(status, createButton("text-action", "Open", () => showReadOnlyAction("Customer profile")));
    row.append(actions);
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
  safety.append(createLinkButton("secondary-link", "Review finance settings", "#/settings"));

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

function renderTemplatesPage(snapshot) {
  const section = createElement("section", "page-grid single");
  const panel = createElement("article", "panel");
  panel.append(createSectionHeader("Templates", "Safe invoice and offer templates prepared with fictional placeholder data.", "Open editor"));

  const list = createElement("div", "data-list");
  for (const template of snapshot.templates) {
    const row = createElement("article", "data-row");
    const copy = createElement("div", "");
    copy.append(createElement("strong", "", template.name));
    copy.append(createElement("span", "", template.type + " - " + template.accent));
    row.append(copy, createStatus(template.status));
    list.append(row);
  }

  panel.append(list);
  section.append(panel);
  return section;
}

function renderSettingsPage(snapshot) {
  const section = createElement("section", "page-grid");
  const settings = createElement("article", "panel");
  settings.append(createSectionHeader("Settings", "Read-only public configuration for the demo workspace."));

  const list = createElement("div", "data-list");
  for (const row of [
    ["Language", snapshot.settings.language],
    ["Currency", snapshot.settings.currency],
    ["Numbering", snapshot.settings.numbering],
    ["Email", snapshot.settings.emailMode],
    ["License", snapshot.settings.licensePlan]
  ]) {
    const item = createElement("article", "data-row");
    item.append(createElement("strong", "", row[0]), createElement("span", "row-value", row[1]));
    list.append(item);
  }

  settings.append(list);

  const safety = createElement("article", "panel panel-dark");
  safety.append(createElement("h2", "", "Reset-safe demo"));
  safety.append(createElement("p", "", "The public demo does not persist edits, does not send email and does not connect to production banking or customer data."));
  safety.append(createButton("primary-button", "Show safety note", () => showDemoToast("Demo mode is read-only and fictional.")));
  safety.append(createButton("secondary-button", "Reset demo workspace", () => showDemoToast("Demo reset complete. The original sample data is still intact.")));

  section.append(settings, safety);
  return section;
}

function renderRoute(snapshot, routeInfo) {
  const routeId = routeInfo.activeRoute;
  if (routeId === "customers") return renderCustomersPage(snapshot);
  if (routeId === "projects") return renderProjectsPage(snapshot);
  if (routeId === "documents" && routeInfo.detailId) return renderDocumentDetailPage(snapshot, routeInfo.detailId);
  if (routeId === "documents") return renderDocumentsPage(snapshot);
  if (routeId === "templates") return renderTemplatesPage(snapshot);
  if (routeId === "finance") return renderFinancePage(snapshot);
  if (routeId === "articles") return renderArticlesPage(snapshot);
  if (routeId === "settings") return renderSettingsPage(snapshot);
  return renderDashboard(snapshot);
}

function renderDemo(snapshot) {
  const app = document.querySelector("#app");
  if (!app) return;

  const routeInfo = getRouteParts();
  app.textContent = "";
  app.append(renderHeader(routeInfo.activeRoute), renderNotice(), renderRoute(snapshot, routeInfo));
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
