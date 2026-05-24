import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename } from "node:path";

const trackedFiles = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

const allowedEnvExamples = new Set([
  ".env.example",
  "docker/development/.env.example",
  "apps/landing-page/.env.example",
]);

const blockedFileNames = [
  /\.env(?!\.example$)/,
  /\.pem$/i,
  /\.p12$/i,
  /\.pfx$/i,
  /private.*key/i,
  /secret.*key/i,
];

const ignoredContentPaths = [
  /^docs\//,
  /^tools\/license\/docs\//,
  /^pnpm-lock\.yaml$/,
  /^tools\/public-release\/verify-public-release\.mjs$/,
];

const blockedContentPatterns = [
  { label: "legacy product name: billme", pattern: /\bbillme\b/i },
  { label: "legacy product name: invoice-platform", pattern: /invoice-platform/i },
  { label: "legacy package scope: @invoice-platform", pattern: /@invoice-platform/i },
  { label: "legacy app name: Invoice Platform", pattern: /Invoice Platform/ },
  { label: "legacy database name: invoice_platform", pattern: /invoice_platform/ },
  { label: "reference invoice company: ViniGrandi", pattern: /Vini\s*Grandi|ViniGrandi/i },
  { label: "reference invoice address: Parkallee", pattern: /Parkallee/i },
];

const failures = [];

for (const file of trackedFiles) {
  if (!allowedEnvExamples.has(file)) {
    for (const pattern of blockedFileNames) {
      if (pattern.test(file) || pattern.test(basename(file))) {
        failures.push(file + ": tracked file name is not public-release safe");
      }
    }
  }

  if (ignoredContentPaths.some((pattern) => pattern.test(file))) continue;

  let content = "";
  try {
    content = readFileSync(file, "utf8");
  } catch {
    continue;
  }

  for (const item of blockedContentPatterns) {
    if (item.pattern.test(content)) {
      failures.push(file + ": " + item.label);
    }
  }
}

if (failures.length > 0) {
  console.error("Public release check failed:");
  for (const failure of failures) console.error("- " + failure);
  process.exit(1);
}

console.log("Public release check passed.");
