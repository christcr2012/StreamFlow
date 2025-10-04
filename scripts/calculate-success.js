#!/usr/bin/env node
// scripts/calculate-success.js
// Calculates success rate, mapping score, and determines which binders need healing
import fs from "fs";
import path from "path";

// Parse command-line arguments
const args = process.argv.slice(2);
const getArg = (flag) => {
  const idx = args.indexOf(flag);
  return idx >= 0 && idx + 1 < args.length ? args[idx + 1] : null;
};

const threshold = parseInt(getArg("--threshold") || "95");
const prePath = getArg("--pre") || "ops/reports/validation_pre.json";
const postPath = getArg("--post") || "ops/reports/validation_post.json";
const orchPath = getArg("--orchestrator") || "ops/reports/orchestrator-report.json";
const outPath = getArg("--out") || "ops/reports/FINAL_SUMMARY.md";
const jsonPath = getArg("--json") || "ops/reports/VERIFY_SUMMARY.json";

// Load data
const preData = JSON.parse(fs.readFileSync(prePath, "utf8"));
const postData = JSON.parse(fs.readFileSync(postPath, "utf8"));
let orchData = fs.existsSync(orchPath) ? JSON.parse(fs.readFileSync(orchPath, "utf8")) : [];

// Normalize orchData to array
if (!Array.isArray(orchData)) {
  orchData = orchData.entries || [];
}

let processedBinders = 0;
let totalBinders = 0;
let needsHeal = [];

// Calculate success rate
for (const [binder, preInfo] of Object.entries(preData.results)) {
  totalBinders++;
  const postInfo = postData.results[binder] || { detected: 0 };
  const orchEntry = orchData.find(e => e.name === binder || e.binder === binder);

  // Success if post >= pre and pre > 0, OR if both are 0 (empty binder), OR orchestrator handled it
  const isSuccess =
    (postInfo.detected >= preInfo.detected && preInfo.detected > 0) ||
    (preInfo.detected === 0 && postInfo.detected === 0) ||
    (orchEntry && orchEntry.handled);

  if (isSuccess) {
    processedBinders++;
  } else {
    needsHeal.push(binder);
  }
}

const successRate = totalBinders > 0 ? Math.round((processedBinders / totalBinders) * 100) : 0;

// Calculate mapping score (orchestrator entries handled / total entries)
const orchHandled = orchData.filter(e => e.handled).length || 0;
const orchTotal = orchData.length || 0;
const mappingScore = orchTotal > 0 ? Math.round((orchHandled / orchTotal) * 100) : 100;

// Generate markdown summary
const markdown = [
  "# Hybrid Binder Execution - Final Summary",
  "",
  `**Generated:** ${new Date().toISOString()}`,
  "",
  "## Metrics",
  "",
  `- **Total Binders:** ${totalBinders}`,
  `- **Processed Successfully:** ${processedBinders}`,
  `- **Success Rate:** ${successRate}%`,
  `- **Threshold:** ${threshold}%`,
  `- **Mapping Score:** ${mappingScore}%`,
  "",
  "## Status",
  "",
  successRate >= threshold && mappingScore === 100
    ? "PASSED - All quality gates met"
    : `NEEDS ATTENTION - Success: ${successRate}%, Mapping: ${mappingScore}%`,
  ""
];

if (needsHeal.length > 0) {
  markdown.push("## Binders Needing Healing");
  markdown.push("");
  needsHeal.forEach(b => markdown.push(`- ${b}`));
  markdown.push("");
}

markdown.push("## Orchestrator Summary");
markdown.push("");
markdown.push(`- **Total Entries:** ${orchTotal}`);
markdown.push(`- **Handled:** ${orchHandled}`);
markdown.push(`- **Skipped:** ${orchTotal - orchHandled}`);
markdown.push("");

fs.writeFileSync(outPath, markdown.join("\n"));

// Generate JSON summary
const jsonSummary = {
  timestamp: new Date().toISOString(),
  successRate,
  mappingScore,
  threshold,
  totalBinders,
  processedBinders,
  needsHeal,
  passed: successRate >= threshold && mappingScore === 100,
  orchestrator: {
    total: orchTotal,
    handled: orchHandled,
    skipped: orchTotal - orchHandled
  }
};

fs.writeFileSync(jsonPath, JSON.stringify(jsonSummary, null, 2));

// Console output
console.log(`\nSUCCESS CALCULATION:`);
console.log(`  Total Binders: ${totalBinders}`);
console.log(`  Processed Successfully: ${processedBinders}`);
console.log(`  Success Rate: ${successRate}%`);
console.log(`  Mapping Score: ${mappingScore}%`);
console.log(`  Threshold: ${threshold}%`);

if (successRate >= threshold && mappingScore === 100) {
  console.log(`\nPASSED: All quality gates met`);
  process.exit(0);
} else {
  console.log(`\nNEEDS ATTENTION: Success ${successRate}%, Mapping ${mappingScore}%`);
  process.exit(0); // Don't fail, let the pipeline decide
}

