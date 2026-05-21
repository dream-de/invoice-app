import { readFileSync } from "node:fs";
import { join } from "node:path";

const data = JSON.parse(readFileSync(join(process.cwd(), "src/demo-data.json"), "utf8"));
const failures = [];

function uniqueBy(items, key, label) {
  const seen = new Set();
  for (const item of items) {
    if (seen.has(item[key])) failures.push(label + " has duplicate " + key + ": " + item[key]);
    seen.add(item[key]);
  }
}

function assert(condition, message) {
  if (!condition) failures.push(message);
}

uniqueBy(data.customers, "id", "customers");
uniqueBy(data.projects, "id", "projects");
uniqueBy(data.documents, "id", "documents");
uniqueBy(data.articles, "id", "articles");
uniqueBy(data.templates, "id", "templates");

const customerIds = new Set(data.customers.map((customer) => customer.id));
const projectIds = new Set(data.projects.map((project) => project.id));

for (const customer of data.customers) {
  assert(customer.email.endsWith(".example"), "customer email must use .example: " + customer.email);
}

for (const project of data.projects) {
  assert(customerIds.has(project.customerId), "project references missing customer: " + project.id);
}

for (const document of data.documents) {
  assert(customerIds.has(document.customerId), "document references missing customer: " + document.id);
  if (document.projectId) assert(projectIds.has(document.projectId), "document references missing project: " + document.id);
  assert(Math.abs(document.net + document.tax - document.gross) < 0.01, "document totals do not add up: " + document.id);
}

for (const account of data.bankAccounts) {
  assert(account.iban.includes("DEMO") || account.iban.startsWith("DE00"), "bank account must be clearly fictional: " + account.id);
}

assert(data.company.email.endsWith(".example"), "company email must use .example");
assert(data.settings.licensePlan === "Public Demo", "settings must stay in public demo mode");

if (failures.length > 0) {
  console.error("Demo integrity check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Demo integrity check passed.");
