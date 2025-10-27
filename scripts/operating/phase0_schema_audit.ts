#!/usr/bin/env tsx
/**
 * Phase 0 — Schema Audit & Plan Synthesis
 *
 * Generates:
 *  - /reports/schema-gap-report.md
 *  - /docs/trace-matrix.md
 *  - /docs/work-plan.md
 *  - /.ai-planning/slices-issues.json (for optional issue sync)
 *
 * Heuristics-only (no Prisma runtime dependency):
 *  - Parses Prisma schema(s) to list models, fields, relations, and enums
 *  - Scans codebase to find candidate backend/frontend/test files per model
 *  - Emits a vertical-slice plan per model with acceptance criteria
 */
import {
  readdirSync,
  readFileSync,
  statSync,
  mkdirSync,
  writeFileSync,
} from "fs";
import { join, resolve } from "path";

const ROOT = resolve(process.cwd());

const SCHEMA_PATHS = [
  join(ROOT, "prisma", "schema.prisma"),
  join(ROOT, "apps", "provider-portal", "prisma", "schema.prisma"),
  // Add more schema locations here if needed
];

interface ModelField {
  name: string;
  type: string;
  modifiers: string[];
  raw: string;
}
interface Relation {
  fromModel: string;
  field: string;
  toModel: string;
}
interface EnumDef {
  name: string;
  values: string[];
}
interface ModelDef {
  name: string;
  fields: ModelField[];
  relations: Relation[];
}

interface ParsedSchema {
  models: ModelDef[];
  enums: EnumDef[];
  source: string;
}

function parseSchema(filePath: string): ParsedSchema | null {
  try {
    const content = readFileSync(filePath, "utf-8");
    const models: ModelDef[] = [];
    const enums: EnumDef[] = [];

    // Basic model blocks: model Name { ... }
    const modelRegex = /model\s+(\w+)\s+\{([\s\S]*?)\}/g;
    let m: RegExpExecArray | null;
    while ((m = modelRegex.exec(content)) !== null) {
      const name = m[1];
      const body = m[2];
      const fields: ModelField[] = [];
      const relations: Relation[] = [];

      const lines = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("//"));
      for (const line of lines) {
        if (line.startsWith("@@")) continue; // block-level attributes
        const parts = line.split(/\s+/);
        if (parts.length < 2) continue;
        const fieldName = parts[0];
        const typeWithMods = parts[1];
        const modifiers: string[] = [];
        let fieldType = typeWithMods;
        if (typeWithMods.endsWith("?")) {
          modifiers.push("?");
          fieldType = fieldType.slice(0, -1);
        }
        if (typeWithMods.endsWith("[]")) {
          modifiers.push("[]");
          fieldType = fieldType.replace(/\[\]$/, "");
        }

        fields.push({ name: fieldName, type: fieldType, modifiers, raw: line });

        // naive relation detection: @relation( references another model name )
        const relMatch = line.match(/@relation\([^)]*\)/);
        if (relMatch) {
          // try to infer a toModel by spotting a field whose type matches a known model later; leave placeholder for now
          // actual linking done after all models are parsed
        }
      }

      models.push({ name, fields, relations });
    }

    // Enum blocks: enum Name { A B C }
    const enumRegex = /enum\s+(\w+)\s+\{([\s\S]*?)\}/g;
    let e: RegExpExecArray | null;
    while ((e = enumRegex.exec(content)) !== null) {
      const name = e[1];
      const body = e[2];
      const values = body
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("//"))
        .map((l) => l.replace(/[,]/g, "").split(/\s+/)[0]);
      enums.push({ name, values });
    }

    // Link relations by matching field types to other model names
    const modelNames = new Set(models.map((md) => md.name));
    for (const md of models) {
      for (const f of md.fields) {
        if (modelNames.has(f.type)) {
          md.relations.push({
            fromModel: md.name,
            field: f.name,
            toModel: f.type,
          });
        }
      }
    }

    return { models, enums, source: filePath.replace(ROOT + /[\\/]/, "") };
  } catch {
    return null;
  }
}

function walk(
  dir: string,
  filterDirs: Set<string>,
  files: string[] = [],
): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return files;
  }
  for (const entry of entries) {
    const abs = join(dir, entry);
    let st;
    try {
      st = statSync(abs);
    } catch {
      continue;
    }
    if (st.isDirectory()) {
      if (filterDirs.has(entry)) continue;
      walk(abs, filterDirs, files);
    } else if (st.isFile()) {
      files.push(abs);
    }
  }
  return files;
}

function findCandidates(model: string) {
  const EXCLUDE = new Set([
    "node_modules",
    ".git",
    ".next",
    "coverage",
    "dist",
    "build",
    "logs",
    ".ai-placeholders",
  ]);
  const files = walk(ROOT, EXCLUDE);
  const relFiles = files.map((f) => f.replace(/\\/g, "/"));
  const backend: string[] = [];
  const frontend: string[] = [];
  const tests: string[] = [];

  for (const f of relFiles) {
    if (!/\.(ts|tsx|js|jsx|md|mdx)$/.test(f)) continue;
    let content = "";
    try {
      content = readFileSync(f, "utf-8");
    } catch {}
    if (!content) continue;

    if (content.includes(model)) {
      if (
        f.includes("/tests/") ||
        f.includes("/__tests__/") ||
        f.includes("/e2e")
      ) {
        tests.push(f);
      } else if (f.includes("/src/app/")) {
        frontend.push(f);
      } else {
        backend.push(f);
      }
    }
  }

  // make lists unique and trimmed
  const uniq = (arr: string[]) => Array.from(new Set(arr)).slice(0, 8);
  return {
    backend: uniq(backend),
    frontend: uniq(frontend),
    tests: uniq(tests),
  };
}

function writeFileEnsured(p: string, content: string) {
  mkdirSync(join(p, ".."), { recursive: true });
  writeFileSync(p, content);
}

async function main() {
  const parsed: ParsedSchema[] = [];
  for (const p of SCHEMA_PATHS) {
    const res = parseSchema(p);
    if (res) parsed.push(res);
  }

  if (parsed.length === 0) {
    console.log("No Prisma schemas found. Nothing to do.");
    process.exit(0);
  }

  const models = parsed.flatMap(
    (s) =>
      s.models.map((m) => ({ ...m, source: s.source })) as Array<
        ModelDef & { source: string }
      >,
  );
  const enums = parsed.flatMap((s) => s.enums);

  // Build schema-gap-report
  const gapLines: string[] = [];
  gapLines.push("# Schema Gap Report");
  gapLines.push("");
  gapLines.push(`Generated: ${new Date().toISOString()}`);
  gapLines.push("");
  gapLines.push("## Schemas");
  for (const s of parsed) {
    gapLines.push(`- ${s.source}`);
  }
  gapLines.push("");
  gapLines.push("## Models");
  for (const m of models) {
    const cands = findCandidates(m.name);
    gapLines.push(`### ${m.name} (${(m as any).source})`);
    gapLines.push("- Fields:");
    for (const f of m.fields)
      gapLines.push(`  - ${f.name}: ${f.type}${f.modifiers.join("")}`);
    if (m.relations.length) {
      gapLines.push("- Relations:");
      for (const r of m.relations)
        gapLines.push(`  - ${r.fromModel}.${r.field} → ${r.toModel}`);
    }
    gapLines.push("- Backend candidates:");
    cands.backend.forEach((f) => gapLines.push(`  - ${f}`));
    gapLines.push("- Frontend candidates:");
    cands.frontend.forEach((f) => gapLines.push(`  - ${f}`));
    gapLines.push("- Test candidates:");
    cands.tests.forEach((f) => gapLines.push(`  - ${f}`));
    gapLines.push("");
  }
  writeFileEnsured(
    join(ROOT, "reports", "schema-gap-report.md"),
    gapLines.join("\n"),
  );

  // Trace matrix
  const traceLines: string[] = [];
  traceLines.push("# Trace Matrix");
  traceLines.push("");
  traceLines.push("| Model.Field | Backend (file) | Frontend (file) | Tests |");
  traceLines.push("|---|---|---|---|");
  for (const m of models) {
    const cands = findCandidates(m.name);
    for (const f of m.fields) {
      traceLines.push(
        `| ${m.name}.${f.name} | ${cands.backend[0] ?? ""} | ${cands.frontend[0] ?? ""} | ${cands.tests[0] ?? ""} |`,
      );
    }
  }
  writeFileEnsured(
    join(ROOT, "docs", "trace-matrix.md"),
    traceLines.join("\n"),
  );

  // Work plan
  const planLines: string[] = [];
  planLines.push("# Work Plan (Vertical Slices)");
  planLines.push("");
  planLines.push("Each slice spans DB → API → UI → tests.");
  planLines.push("");
  for (const m of models) {
    planLines.push(`## Slice: ${m.name}`);
    planLines.push("### Acceptance Criteria");
    planLines.push("- [ ] DB migration(s) and Prisma client updated");
    planLines.push(
      "- [ ] Backend endpoints/services implemented with validation + auth/ACL",
    );
    planLines.push("- [ ] Frontend route(s)/component(s)/form(s) implemented");
    planLines.push("- [ ] Tests: unit, integration, e2e passing");
    planLines.push("- [ ] Observability added (logs/errors)");
    planLines.push("- [ ] Docs + Trace Matrix updated");
    planLines.push("- [ ] Zero placeholders in code");
    planLines.push("");
  }
  writeFileEnsured(join(ROOT, "docs", "work-plan.md"), planLines.join("\n"));

  // Slice issues payload (optional sync)
  const issues = models.map((m) => {
    const id = `slice:${m.name}`;
    const title = `Vertical Slice: ${m.name}`;
    const body = [
      "## Scope",
      `- Model(s): ${m.name}`,
      "",
      "## Acceptance Criteria",
      "- [ ] DB migration(s) and Prisma client updated",
      "- [ ] Backend endpoints/services implemented with validation + auth/ACL",
      "- [ ] Frontend route(s)/component(s)/form(s) implemented",
      "- [ ] Tests: unit, integration, e2e passing",
      "- [ ] Observability added (logs/errors)",
      "- [ ] Docs + Trace Matrix updated",
      "- [ ] Zero placeholders in code",
      "",
    ].join("\n");
    const labels = ["slice"];
    return { id, title, body, labels };
  });
  const planningDir = join(ROOT, ".ai-planning");
  mkdirSync(planningDir, { recursive: true });
  writeFileSync(
    join(planningDir, "slices-issues.json"),
    JSON.stringify(issues, null, 2),
  );

  console.log("✅ Phase 0 artifacts generated:");
  console.log(" - reports/schema-gap-report.md");
  console.log(" - docs/trace-matrix.md");
  console.log(" - docs/work-plan.md");
  console.log(" - .ai-planning/slices-issues.json");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
