#!/usr/bin/env tsx
/**
 * Phase 1 Gap Analyzer
 *
 * Takes the Phase 0 docs audit and separates:
 * 1. Real missing scaffolds (need to create in Phase 1)
 * 2. Documentation drift (files moved/renamed)
 * 3. External references/examples (can ignore)
 * 4. Glob patterns (documentation conventions)
 *
 * Outputs: docs/PHASE_1_SCAFFOLD_PLAN.md
 */

import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { glob } from "glob";

const ROOT = process.cwd();

interface PhaseAuditData {
  documentedPathsNotFound: string[];
  endpointsDocumentedButNotImplemented: string[];
  endpointsImplementedButNotDocumented: string[];
}

function parseDocsAudit(): PhaseAuditData {
  const auditPath = join(ROOT, "docs/PHASE_0_DOCS_AUDIT.md");
  const content = readFileSync(auditPath, "utf-8");

  const result: PhaseAuditData = {
    documentedPathsNotFound: [],
    endpointsDocumentedButNotImplemented: [],
    endpointsImplementedButNotDocumented: [],
  };

  let currentSection: keyof PhaseAuditData | null = null;

  for (const line of content.split("\n")) {
    if (line.startsWith("## Documented Paths Not Found")) {
      currentSection = "documentedPathsNotFound";
    } else if (line.startsWith("## Endpoints Documented But Not Implemented")) {
      currentSection = "endpointsDocumentedButNotImplemented";
    } else if (line.startsWith("## Endpoints Implemented But Not Documented")) {
      currentSection = "endpointsImplementedButNotDocumented";
    } else if (line.startsWith("- ") && currentSection) {
      const item = line.slice(2).trim();
      result[currentSection].push(item);
    }
  }

  return result;
}

function isExternalReference(path: string): boolean {
  // Examples, documentation patterns, external references
  const externalPatterns = [
    /^\.\.\//, // Parent directory references
    /^\.\/(?:example|foo|bar|mod|helpers|dist|node_modules)/i,
    /example\.js/i,
    /stryker\.config/i,
    /\.yarn\/versions/,
    /circleci/i,
    /vscode\/launch/i,
    /<MODULE_NAME>/,
    /reassure\/output/,
  ];

  return externalPatterns.some((p) => p.test(path));
}

function isGlobPattern(path: string): boolean {
  return path.includes("*") || path.includes("[") || path.includes("...");
}

function isLegitMissingFile(path: string): boolean {
  // Real files that should exist
  if (isExternalReference(path) || isGlobPattern(path)) return false;

  // Check if it's in our apps or packages
  if (
    !path.startsWith("apps/") &&
    !path.startsWith("packages/") &&
    !path.startsWith("prisma/")
  ) {
    // Check if path starts with common source dirs
    if (path.startsWith("src/") || path.startsWith("docs/")) {
      // Might be legacy path reference - check if similar file exists
      return false; // Assume documentation drift for now
    }
    return false;
  }

  // Real app/package paths
  return true;
}

function categorizeEndpoint(endpoint: string): {
  category:
    | "provider"
    | "tenant"
    | "analyst"
    | "developer"
    | "owner"
    | "federation"
    | "other";
  priority: "high" | "medium" | "low";
  phase: string;
} {
  if (endpoint.startsWith("/api/provider/")) {
    return { category: "provider", priority: "high", phase: "Phase 1" };
  }
  if (endpoint.startsWith("/api/cleaning/")) {
    return { category: "tenant", priority: "high", phase: "Phase 2" };
  }
  if (endpoint.startsWith("/api/v2/")) {
    return { category: "tenant", priority: "high", phase: "Phase 1" };
  }
  if (endpoint.startsWith("/api/analyst/")) {
    return { category: "analyst", priority: "medium", phase: "Phase 1" };
  }
  if (endpoint.startsWith("/api/developer/")) {
    return { category: "developer", priority: "medium", phase: "Phase 1" };
  }
  if (endpoint.startsWith("/api/owner/")) {
    return { category: "owner", priority: "medium", phase: "Phase 1" };
  }
  if (
    endpoint.startsWith("/api/federation/") ||
    endpoint.startsWith("/api/fed/")
  ) {
    return { category: "federation", priority: "high", phase: "Phase 1" };
  }

  return { category: "other", priority: "low", phase: "Phase 2" };
}

async function main() {
  const audit = parseDocsAudit();

  // Analyze paths
  const legitMissingPaths =
    audit.documentedPathsNotFound.filter(isLegitMissingFile);
  const externalRefs =
    audit.documentedPathsNotFound.filter(isExternalReference);
  const globs = audit.documentedPathsNotFound.filter(isGlobPattern);

  // Categorize endpoints
  const endpointsByCategory = new Map<string, string[]>();
  const endpointsByPriority = new Map<string, string[]>();

  for (const endpoint of audit.endpointsDocumentedButNotImplemented) {
    const cat = categorizeEndpoint(endpoint);

    if (!endpointsByCategory.has(cat.category)) {
      endpointsByCategory.set(cat.category, []);
    }
    endpointsByCategory.get(cat.category)!.push(endpoint);

    if (!endpointsByPriority.has(cat.priority)) {
      endpointsByPriority.set(cat.priority, []);
    }
    endpointsByPriority.get(cat.priority)!.push(endpoint);
  }

  // Generate report
  const lines: string[] = [];
  lines.push("# Phase 1 Scaffold Plan");
  lines.push("");
  lines.push("**Generated:** " + new Date().toISOString());
  lines.push("");
  lines.push("## Executive Summary");
  lines.push("");
  lines.push("### Path Analysis");
  lines.push(
    `- Total documented paths not found: ${audit.documentedPathsNotFound.length}`,
  );
  lines.push(`- Legitimate missing files: ${legitMissingPaths.length}`);
  lines.push(`- External references (ignore): ${externalRefs.length}`);
  lines.push(`- Glob patterns (documentation): ${globs.length}`);
  lines.push("");
  lines.push("### Endpoint Analysis");
  lines.push(
    `- Total endpoints documented but not implemented: ${audit.endpointsDocumentedButNotImplemented.length}`,
  );
  lines.push(
    `- High priority (Phase 1): ${endpointsByPriority.get("high")?.length || 0}`,
  );
  lines.push(
    `- Medium priority (Phase 1): ${endpointsByPriority.get("medium")?.length || 0}`,
  );
  lines.push(
    `- Low priority (Phase 2+): ${endpointsByPriority.get("low")?.length || 0}`,
  );
  lines.push("");

  // Endpoint breakdown
  lines.push("## Missing Endpoints by Category");
  lines.push("");

  const categories = [
    "provider",
    "tenant",
    "analyst",
    "developer",
    "owner",
    "federation",
    "other",
  ];
  for (const cat of categories) {
    const endpoints = endpointsByCategory.get(cat) || [];
    if (endpoints.length === 0) continue;

    lines.push(
      `### ${cat.charAt(0).toUpperCase() + cat.slice(1)} Portal (${endpoints.length} endpoints)`,
    );
    lines.push("");
    for (const ep of endpoints.sort()) {
      const meta = categorizeEndpoint(ep);
      lines.push(`- \`${ep}\` - ${meta.phase} (${meta.priority} priority)`);
    }
    lines.push("");
  }

  // Legitimate missing files
  if (legitMissingPaths.length > 0) {
    lines.push("## Missing Files");
    lines.push("");
    lines.push(
      "These files are referenced in docs but not found in the codebase:",
    );
    lines.push("");
    for (const path of legitMissingPaths.sort()) {
      lines.push(`- \`${path}\``);
    }
    lines.push("");
  }

  // Phase 1 Action Items
  lines.push("## Phase 1 Action Items");
  lines.push("");
  lines.push("### High Priority Scaffolds (Required for Phase 1 Completion)");
  lines.push("");

  const highPriority = endpointsByPriority.get("high") || [];
  lines.push(`Total: ${highPriority.length} endpoint scaffolds`);
  lines.push("");

  // Group by app
  const providerEndpoints = highPriority.filter(
    (ep) => categorizeEndpoint(ep).category === "provider",
  );
  const tenantEndpoints = highPriority.filter(
    (ep) => categorizeEndpoint(ep).category === "tenant",
  );
  const federationEndpoints = highPriority.filter(
    (ep) => categorizeEndpoint(ep).category === "federation",
  );

  if (providerEndpoints.length > 0) {
    lines.push(`#### Provider Portal API Routes (${providerEndpoints.length})`);
    lines.push("");
    lines.push("Location: `apps/provider-portal/src/app/api/`");
    lines.push("");
    for (const ep of providerEndpoints.sort()) {
      const routePath = ep.replace("/api/", "") + "/route.ts";
      lines.push(`- [ ] Create \`${routePath}\``);
      lines.push(`  - Endpoint: \`${ep}\``);
      lines.push(`  - Auth: getProviderSession()`);
      lines.push(`  - Placeholder: PLACEHOLDER_block_phase2`);
    }
    lines.push("");
  }

  if (tenantEndpoints.length > 0) {
    lines.push(`#### Tenant App API Routes (${tenantEndpoints.length})`);
    lines.push("");
    lines.push("Location: `apps/tenant-app/src/app/api/`");
    lines.push("");
    for (const ep of tenantEndpoints.sort()) {
      const routePath = ep.replace("/api/", "") + "/route.ts";
      lines.push(`- [ ] Create \`${routePath}\``);
      lines.push(`  - Endpoint: \`${ep}\``);
      lines.push(`  - Auth: getAuthContext()`);
      lines.push(`  - Placeholder: PLACEHOLDER_block_phase2`);
    }
    lines.push("");
  }

  if (federationEndpoints.length > 0) {
    lines.push(`#### Federation API Routes (${federationEndpoints.length})`);
    lines.push("");
    lines.push(
      "Location: `apps/provider-portal/src/app/api/fed/` or `apps/tenant-app/src/app/api/federation/`",
    );
    lines.push("");
    for (const ep of federationEndpoints.sort()) {
      lines.push(`- [ ] Create route for \`${ep}\``);
      lines.push(`  - Determine correct app (provider vs tenant)`);
      lines.push(`  - Add federation auth middleware`);
    }
    lines.push("");
  }

  // Medium priority
  const mediumPriority = endpointsByPriority.get("medium") || [];
  if (mediumPriority.length > 0) {
    lines.push(`### Medium Priority Scaffolds (${mediumPriority.length})`);
    lines.push("");
    lines.push(
      "Analyst, Developer, Owner portals - can be scaffolded after high priority:",
    );
    lines.push("");
    for (const ep of mediumPriority.sort()) {
      const cat = categorizeEndpoint(ep);
      lines.push(`- \`${ep}\` (${cat.category})`);
    }
    lines.push("");
  }

  // Implementation patterns
  lines.push("## Scaffold Patterns");
  lines.push("");
  lines.push("### API Route Scaffold Template");
  lines.push("");
  lines.push("```typescript");
  lines.push("// apps/[app]/src/app/api/[feature]/route.ts");
  lines.push('import { NextRequest, NextResponse } from "next/server";');
  lines.push('import { z } from "zod";');
  lines.push('import { getAuthContext } from "@/lib/auth-context";');
  lines.push('import { createSafeErrorResponse } from "@/lib/error-handler";');
  lines.push("");
  lines.push("const schema = z.object({");
  lines.push("  // TODO Phase 2: Add validation schema");
  lines.push("});");
  lines.push("");
  lines.push("export async function GET(req: NextRequest) {");
  lines.push("  try {");
  lines.push("    const auth = await getAuthContext();");
  lines.push("    if (!auth.isAuthenticated) {");
  lines.push(
    '      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });',
  );
  lines.push("    }");
  lines.push("");
  lines.push("    // PLACEHOLDER_block_phase2: Implement real query");
  lines.push(
    "    // Phase 2: Query from Prisma, apply orgId scoping, return data",
  );
  lines.push("    const data = [];");
  lines.push("");
  lines.push("    return NextResponse.json({ ok: true, data });");
  lines.push("  } catch (error) {");
  lines.push(
    '    return createSafeErrorResponse(error, "GET /api/[feature]");',
  );
  lines.push("  }");
  lines.push("}");
  lines.push("```");
  lines.push("");

  // Write output
  const outPath = join(ROOT, "docs/PHASE_1_SCAFFOLD_PLAN.md");
  writeFileSync(outPath, lines.join("\n"), "utf-8");

  console.log(
    "✅ Phase 1 Scaffold Plan written to docs/PHASE_1_SCAFFOLD_PLAN.md",
  );
  console.log("");
  console.log("📊 Summary:");
  console.log(`   • High priority scaffolds: ${highPriority.length}`);
  console.log(`   • Medium priority scaffolds: ${mediumPriority.length}`);
  console.log(
    `   • Low priority (Phase 2): ${endpointsByPriority.get("low")?.length || 0}`,
  );
  console.log(`   • Legitimate missing files: ${legitMissingPaths.length}`);
  console.log("");
  console.log("Next: Review plan and begin creating scaffolds");
}

main().catch((err) => {
  console.error("Analysis failed:", err);
  process.exit(1);
});
