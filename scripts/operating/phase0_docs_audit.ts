#!/usr/bin/env tsx
/**
 * Phase 0 - Documentation ↔ Code Conformance Audit
 *
 * Scans project documentation (.md) for referenced file paths and API endpoints,
 * compares them to actual repository files and Next.js App Router routes, and
 * emits a report to docs/PHASE_0_DOCS_AUDIT.md.
 *
 * Scope:
 * - Docs: all *.md in repo root and /docs
 * - Code files: everything under apps/* and packages/*
 * - API routes: under apps/{app}/src/app/api/(globs)/route.ts mapped to /api/... paths
 */

import { glob } from "glob";
import fs from "fs";
import path from "path";

const REPO_ROOT = process.cwd().replace(/\\/g, "/");

function readFileSafe(p: string): string {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

function normalizePath(p: string): string {
  let s = p.replace(/\\/g, "/");
  // Strip absolute repo root from documented paths if present
  if (s.toLowerCase().startsWith(REPO_ROOT.toLowerCase())) {
    s = s.slice(REPO_ROOT.length + (REPO_ROOT.endsWith("/") ? 0 : 1));
  }
  // Remove leading drive letters like C:/
  s = s.replace(/^[A-Za-z]:\//, "");
  // Collapse duplicate slashes
  s = s.replace(/\/+/g, "/");
  return s;
}

function extractBacktickedPaths(md: string): string[] {
  // Capture backticked segments that look like file paths or contain slashes
  const re = /`([^`\n]*\/[\w@{}().\-\[\]\/]+)`/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const raw = m[1];
    // Ignore URLs with http(s)
    if (/^https?:\/\//i.test(raw)) continue;
    // Ignore anchors
    if (raw.startsWith("#")) continue;
    out.add(normalizePath(raw));
  }
  return Array.from(out);
}

function extractApiEndpoints(md: string): string[] {
  // Find literal mentions like /api/foo or /api/v2/foo/bar
  const re = /(^|\s)(\/api\/[A-Za-z0-9_\-\/\[\]]+)/g;
  const out = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(md))) {
    const endpoint = m[2].replace(/\/$/, "");
    out.add(endpoint);
  }
  return Array.from(out);
}

function routePathFromFile(file: string): string | null {
  // Example: apps/tenant-app/src/app/api/foo/bar/route.ts -> /api/foo/bar
  const ix = file.indexOf("/src/app/api/");
  if (ix === -1) return null;
  const after = file.slice(ix + "/src/app".length); // starts with /api/...
  let route = after.replace(/\/route\.(ts|tsx|js|mjs)$/i, "");
  // Normalize dynamic segments: [id] stays as [id]
  route = route.replace(/\\/g, "/");
  return route;
}

async function main() {
  // 1) Collect docs
  const docFiles = await glob(["**/*.md", "!node_modules/**", "!**/.git/**"], {
    cwd: REPO_ROOT,
    absolute: true,
    nodir: true,
  });
  const docsInScope = docFiles.filter((f) => {
    const rel = normalizePath(f);
    return rel.startsWith("docs/") || /\.(md)$/i.test(rel);
  });

  // 2) Extract documented paths and endpoints
  const documentedPaths = new Set<string>();
  const documentedEndpoints = new Set<string>();

  for (const file of docsInScope) {
    const md = readFileSafe(file);
    if (!md) continue;
    for (const p of extractBacktickedPaths(md)) documentedPaths.add(p);
    for (const ep of extractApiEndpoints(md)) documentedEndpoints.add(ep);
  }

  // 3) Gather actual repository files
  const codeFiles = await glob(["apps/**", "packages/**"], {
    cwd: REPO_ROOT,
    absolute: true,
    nodir: true,
  });
  const codeFileSet = new Set(
    codeFiles.map((p) => normalizePath(path.relative(REPO_ROOT, p))),
  );

  // 4) Gather actual API route file paths and map to endpoints
  const routeFiles = await glob(["apps/*/src/app/api/**/route.*"], {
    cwd: REPO_ROOT,
    absolute: true,
    nodir: true,
  });
  const actualRoutes = new Set<string>();
  for (const rf of routeFiles) {
    const rel = normalizePath(path.relative(REPO_ROOT, rf));
    const rp = routePathFromFile(rel);
    if (rp) actualRoutes.add(rp);
  }

  // 5) Compute diffs
  const documentedButMissing: string[] = [];
  for (const p of documentedPaths) {
    // Skip obviously non-repo references
    if (/^\./.test(p) || /^(apps|packages|prisma|scripts|src|docs)\//.test(p)) {
      if (!codeFileSet.has(p) && !fs.existsSync(path.join(REPO_ROOT, p))) {
        documentedButMissing.push(p);
      }
    }
  }

  const endpointsDocumentedButMissing: string[] = [];
  for (const ep of documentedEndpoints) {
    if (!actualRoutes.has(ep)) endpointsDocumentedButMissing.push(ep);
  }

  const endpointsExistingButUndocumented: string[] = [];
  for (const ep of actualRoutes) {
    if (!documentedEndpoints.has(ep)) endpointsExistingButUndocumented.push(ep);
  }

  // 6) Emit report
  const outPath = path.join(REPO_ROOT, "docs/PHASE_0_DOCS_AUDIT.md");
  const lines: string[] = [];
  lines.push("# Phase 0 - Documentation ↔ Code Conformance Audit");
  lines.push("");
  lines.push("Date: " + new Date().toISOString());
  lines.push(
    "Scope: All Markdown docs in repo root and /docs; code under /apps and /packages.",
  );
  lines.push("");
  lines.push("## Summary");
  lines.push("- Documented paths not found: " + documentedButMissing.length);
  lines.push(
    "- Endpoints documented but not implemented: " +
      endpointsDocumentedButMissing.length,
  );
  lines.push(
    "- Endpoints implemented but not documented: " +
      endpointsExistingButUndocumented.length,
  );
  lines.push("");

  if (documentedButMissing.length) {
    lines.push("## Documented Paths Not Found");
    lines.push("");
    for (const p of documentedButMissing.sort()) lines.push("- " + p);
    lines.push("");
  }

  if (endpointsDocumentedButMissing.length) {
    lines.push("## Endpoints Documented But Not Implemented");
    lines.push("");
    for (const ep of endpointsDocumentedButMissing.sort())
      lines.push("- " + ep);
    lines.push("");
  }

  if (endpointsExistingButUndocumented.length) {
    lines.push("## Endpoints Implemented But Not Documented");
    lines.push("");
    for (const ep of endpointsExistingButUndocumented.sort())
      lines.push("- " + ep);
    lines.push("");
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, lines.join("\n"), "utf8");

  // Print a short console summary
  console.log(
    "✅ Phase 0 Docs Audit written to",
    path.relative(REPO_ROOT, outPath),
  );
  console.log("  • Documented paths not found:", documentedButMissing.length);
  console.log(
    "  • Endpoints documented but not implemented:",
    endpointsDocumentedButMissing.length,
  );
  console.log(
    "  • Endpoints implemented but not documented:",
    endpointsExistingButUndocumented.length,
  );
}

main().catch((err) => {
  console.error("Docs audit failed:", err);
  process.exit(1);
});
