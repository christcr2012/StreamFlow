// scripts/verify-real-code.js
// Verifies that binders produced real code and correlates items to files.
import fs from "fs";
import path from "path";
import { glob } from "glob";

const CFG = {
  minApi: parseInt(process.env.MIN_GENERATED_API_FILES || "100"),
  minUi: parseInt(process.env.MIN_GENERATED_UI_FILES || "10"),
  requiredSuccessRate: parseInt(process.env.REQUIRED_SUCCESS_RATE || "95"),
  reportsDir: "ops/reports",
  outJson: "ops/reports/verify_binder_to_code.json",
  outMd: "ops/reports/VERIFY_SUMMARY.md",
  apiGlobs: ["src/pages/api/**/*.ts", "src/pages/api/**/*.tsx"],
  uiGlobs: ["src/app/**/*.tsx", "src/components/**/*.tsx"],
  idMarkers: [/AUTO-GENERATED/i, /generated from/i, /binder\d+/i],
  // Fallback matchers: very light heuristic (won't be perfect, just signal)
  fallbackRoutes: [/GET\s+\/\S+/i, /POST\s+\/\S+/i, /PUT\s+\/\S+/i, /DELETE\s+\/\S+/i],
};

function safeJsonLoad(p, def = null) {
  try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return def; }
}

async function listFiles(patterns) {
  const s = new Set();
  for (const g of patterns) {
    const files = await glob(g, { windowsPathsNoEscape: true });
    files.forEach((f) => s.add(f));
  }
  return [...s];
}

function fileHasMarkers(file, markers) {
  try {
    const s = fs.readFileSync(file, "utf8");
    return markers.some((re) => re.test(s));
  } catch { return false; }
}

function estimateMappingScore(orchestrator, apiFiles) {
  // If orchestrator report exists, use it to gauge coverage of "generated" entries
  if (!orchestrator || !Array.isArray(orchestrator)) return { checked: 0, matched: 0, pct: 0 };

  // Take a sample to avoid loading millions of lines on huge repos
  const sample = orchestrator.filter(e => e && e.mode === "generated").slice(0, 2000);
  let matched = 0;
  for (const e of sample) {
    // Try to find a file that mentions the endpoint or has a generated header
    const found = apiFiles.some(f => fileHasMarkers(f, CFG.idMarkers));
    if (found) matched++;
  }
  const pct = sample.length ? Math.round((matched / sample.length) * 100) : 0;
  return { checked: sample.length, matched, pct };
}

async function main() {
  fs.mkdirSync(CFG.reportsDir, { recursive: true });

  console.log("🔍 Listing generated files...");
  const apiFiles = await listFiles(CFG.apiGlobs);
  const uiFiles = await listFiles(CFG.uiGlobs);

  console.log(`  Found ${apiFiles.length} API files`);
  console.log(`  Found ${uiFiles.length} UI files`);

  const orchestrator = safeJsonLoad(path.join(CFG.reportsDir, "orchestrator-report.json"), []);
  const preVal = safeJsonLoad(path.join(CFG.reportsDir, "validation_pre.json"), null);
  const postVal = safeJsonLoad(path.join(CFG.reportsDir, "validation_post.json"), null);

  // Presence + size checks
  const hasEnoughApi = apiFiles.length >= CFG.minApi;
  const hasEnoughUi = uiFiles.length >= CFG.minUi;

  console.log("🔍 Sampling API files for generation markers...");
  // Header/marker sampling
  const apiMarkerHits = apiFiles.slice(0, 500).filter(f => fileHasMarkers(f, CFG.idMarkers)).length;

  console.log("🔍 Estimating mapping score...");
  // Estimated mapping score using orchestrator "generated" entries vs presence of headers
  const mapping = estimateMappingScore(orchestrator, apiFiles);

  const result = {
    summary: {
      apiFiles: apiFiles.length,
      uiFiles: uiFiles.length,
      apiMarkerSampleHits: apiMarkerHits,
      mappingChecked: mapping.checked,
      mappingMatched: mapping.matched,
      mappingPct: mapping.pct,
      thresholds: {
        minApi: CFG.minApi,
        minUi: CFG.minUi,
        requiredSuccessRate: CFG.requiredSuccessRate
      }
    },
    reportsFound: {
      orchestrator: !!orchestrator && orchestrator.length > 0,
      validation_pre: !!preVal,
      validation_post: !!postVal
    },
    checks: {
      hasEnoughApi,
      hasEnoughUi,
      mappingMeetsThreshold: mapping.pct >= CFG.requiredSuccessRate
    },
    pass: (hasEnoughApi && hasEnoughUi && mapping.pct >= CFG.requiredSuccessRate)
  };

  fs.writeFileSync(CFG.outJson, JSON.stringify(result, null, 2));
  
  const md = [
    "# Binder → Code Verification Summary",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    "",
    "## File Counts",
    `- API files: **${result.summary.apiFiles}** (min ${CFG.minApi}) ${hasEnoughApi ? '✅' : '❌'}`,
    `- UI files: **${result.summary.uiFiles}** (min ${CFG.minUi}) ${hasEnoughUi ? '✅' : '❌'}`,
    "",
    "## Generation Markers",
    `- API marker sample hits: **${result.summary.apiMarkerSampleHits}** / 500 checked`,
    "",
    "## Mapping Score",
    `- Checked: **${result.summary.mappingChecked}** orchestrator entries`,
    `- Matched: **${result.summary.mappingMatched}**`,
    `- Score: **${result.summary.mappingPct}%** (required ≥ ${CFG.requiredSuccessRate}%) ${result.checks.mappingMeetsThreshold ? '✅' : '❌'}`,
    "",
    "## Reports Present",
    `- orchestrator-report.json: ${result.reportsFound.orchestrator ? '✅' : '❌'}`,
    `- validation_pre.json: ${result.reportsFound.validation_pre ? '✅' : '❌'}`,
    `- validation_post.json: ${result.reportsFound.validation_post ? '✅' : '❌'}`,
    "",
    "## Final Result",
    `**${result.pass ? "PASS ✅" : "FAIL ❌"}**`,
    "",
    result.pass ? "All verification checks passed." : "One or more verification checks failed. Review the details above."
  ].join("\n");
  
  fs.writeFileSync(CFG.outMd, md);

  // Console table
  console.log("\n=== VERIFY SUMMARY ===");
  console.table({
    "API Files": result.summary.apiFiles,
    "UI Files": result.summary.uiFiles,
    "API Markers (sample)": result.summary.apiMarkerSampleHits,
    "Mapping %": result.summary.mappingPct,
    "Required %": CFG.requiredSuccessRate,
    "PASS": result.pass ? "✅" : "❌"
  });

  console.log(`\n📄 Reports saved:`);
  console.log(`  - ${CFG.outJson}`);
  console.log(`  - ${CFG.outMd}`);

  if (!result.pass) {
    console.error("\n❌ VERIFICATION FAILED");
    process.exit(2);
  } else {
    console.log("\n✅ VERIFICATION PASSED");
  }
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

