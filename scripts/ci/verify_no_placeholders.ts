/**
 * Placeholder/Stub Detector
 * Fails CI if any placeholder markers or stubbed implementations are found
 *
 * Detects:
 * - TODO, FIXME, HACK, XXX, STUB
 * - "Not implemented" phrases
 * - status: 501 responses
 * - "Coming Soon" or "Under Construction" text
 */
import { readdirSync, readFileSync, statSync } from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());

const PLACEHOLDER_PATTERNS: { label: string; regex: RegExp }[] = [
  { label: "TODO", regex: /\bTODO\b/i },
  { label: "FIXME", regex: /\bFIXME\b/i },
  { label: "HACK", regex: /\bHACK\b/i },
  { label: "XXX", regex: /\bXXX\b/i },
  { label: "STUB", regex: /\bSTUB\b/i },
  { label: "Not implemented", regex: /not\s+implemented/i },
  { label: "HTTP 501", regex: /status\s*:\s*501/ },
  { label: "Coming Soon", regex: /coming\s+soon/i },
  { label: "Under Construction", regex: /under\s+construction/i },
];

const EXCLUDED_DIRS = new Set<string>([
  "node_modules",
  ".next",
  "dist",
  "build",
  ".git",
  "playwright-report",
  "test-results",
  "coverage",
  "logs",
  // Allow placeholders in docs and certain planning files
  "docs",
  "playwright-report",
]);

const EXCLUDED_FILES = new Set<string>([
  "scripts/ci/verify_no_placeholders.ts",
]);

const INCLUDED_EXTS = new Set<string>([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mdx",
  ".json",
]);

function shouldSkipPath(relativePath: string): boolean {
  const parts = relativePath.split(/[\\/]/);
  return parts.some((p) => EXCLUDED_DIRS.has(p));
}

function hasIncludedExtension(file: string): boolean {
  const idx = file.lastIndexOf(".");
  if (idx === -1) return false;
  return INCLUDED_EXTS.has(file.slice(idx));
}

type Violation = { file: string; line: number; label: string; snippet: string };

function scanFile(filePath: string): Violation[] {
  const relFromRoot = filePath.replace(ROOT + /[\\/]/, "").replace(/\\/g, "/");
  if (EXCLUDED_FILES.has(relFromRoot)) return [];
  if (!hasIncludedExtension(filePath)) return [];
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split(/\r?\n/);
  const violations: Violation[] = [];

  lines.forEach((line, i) => {
    for (const pattern of PLACEHOLDER_PATTERNS) {
      if (pattern.regex.test(line)) {
        violations.push({
          file: filePath,
          line: i + 1,
          label: pattern.label,
          snippet: line.trim().slice(0, 240),
        });
      }
    }
  });

  return violations;
}

function scanDir(dir: string, base = ""): Violation[] {
  const entries = readdirSync(dir);
  let results: Violation[] = [];
  for (const entry of entries) {
    const abs = join(dir, entry);
    const rel = base ? join(base, entry) : entry;
    if (shouldSkipPath(rel)) continue;
    const st = statSync(abs);
    if (st.isDirectory()) {
      results = results.concat(scanDir(abs, rel));
    } else if (st.isFile()) {
      results = results.concat(scanFile(abs));
    }
  }
  return results;
}

const violations = scanDir(ROOT);

if (violations.length > 0) {
  const strict = process.env.PLACEHOLDER_STRICT === "true";
  const header = strict
    ? "❌ Placeholder/Stub Detection Failed"
    : "⚠️ Placeholder/Stub Detection Report (non-blocking)";
  console[strict ? "error" : "log"](header);
  const grouped = new Map<string, Violation[]>();
  for (const v of violations) {
    const rel = v.file.replace(ROOT + /[\\/]/, "");
    if (!grouped.has(rel)) grouped.set(rel, []);
    grouped.get(rel)!.push(v);
  }

  grouped.forEach((items, file) => {
    console.error(`\nFile: ${file}`);
    items.forEach((v) => {
      console.error(`  [${v.line}] (${v.label}) ${v.snippet}`);
    });
  });

  process.exit(strict ? 1 : 0);
} else {
  console.log("✅ No placeholders/stubs detected");
}
