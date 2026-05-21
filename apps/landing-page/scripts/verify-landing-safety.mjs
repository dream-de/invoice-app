import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const files = [
  join(root, "index.html"),
  ...readdirSync(join(root, "src"))
    .filter((entry) => /\.(js|ts|css)$/.test(entry))
    .map((entry) => join(root, "src", entry)),
];

const blockedPatterns = [
  /DATABASE_URL/,
  /POSTGRES_/,
  /PRIVATE_KEY/i,
  /ACCESS_TOKEN/i,
  /API_KEY/i,
  /SECRET/i,
  /fetch\(["'`]\s*\/api\//,
];

const failures = [];

for (const file of files) {
  if (!statSync(file).isFile()) continue;
  const content = readFileSync(file, "utf8");
  for (const pattern of blockedPatterns) {
    if (pattern.test(content)) failures.push(file + " matches " + pattern);
  }
}

if (failures.length > 0) {
  console.error("Landing safety check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Landing safety check passed.");
