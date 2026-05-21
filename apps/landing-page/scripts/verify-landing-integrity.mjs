import { existsSync, readFileSync } from "node:fs";
import { dirname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const source = readFileSync(join(root, "src", "landing-content.ts"), "utf8");
const app = readFileSync(join(root, "src", "landing-app.js"), "utf8");
const failures = [];

function requireText(label, text) {
  if (!source.includes(text) && !app.includes(text)) failures.push(label + " missing: " + text);
}

requireText("product", "Dream Invoice");
requireText("demo domain", "https://demo.dream-invoice.com");
requireText("app domain", "https://app.dream-invoice.com");

const legacyNames = ["Bil" + "lme", "bil" + "lme", "Invoice " + "Platform", "apps/" + "invoice"];
for (const forbidden of legacyNames) {
  if (source.includes(forbidden) || app.includes(forbidden)) failures.push("forbidden text found: " + forbidden);
}

const screenshotMatches = [...source.matchAll(/"src": "(\.\/assets\/screenshots\/[^"]+)"/g)].map((match) => match[1]);
if (screenshotMatches.length < 3) failures.push("expected at least three screenshot references");

for (const screenshot of screenshotMatches) {
  const assetPath = join(root, "public", normalize(screenshot.replace(/^\.\//, "")));
  if (!existsSync(assetPath)) failures.push("missing screenshot asset: " + screenshot);
}

if (failures.length > 0) {
  console.error("Landing integrity check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Landing integrity check passed.");

