import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const blockedPatterns = [
  /fetch\(["'`]\s*\/api\//,
  /https?:\/\//,
  /DATABASE_URL/,
  /POSTGRES_/,
  /SECRET/i,
  /PRIVATE_KEY/i,
  /ACCESS_TOKEN/i,
  /API_KEY/i,
];

const sourceDir = join(dirname(fileURLToPath(import.meta.url)), "../src");
const failures = [];

function visit(dir) {
  for (const entry of readdirSync(dir)) {
    const filePath = join(dir, entry);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      visit(filePath);
      continue;
    }

    if (!/\.(js|ts|json|css)$/.test(filePath)) continue;

    const content = readFileSync(filePath, "utf8");
    for (const pattern of blockedPatterns) {
      if (pattern.test(content)) {
        failures.push(filePath + " matches " + pattern);
      }
    }
  }
}

visit(sourceDir);

if (failures.length > 0) {
  console.error("Demo safety check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Demo safety check passed.");
