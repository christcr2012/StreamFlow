// scripts/report-failures.js
// Generates detailed failure report with actionable fixes
import fs from "fs";
import path from "path";

const REPORTS_DIR = "ops/reports";
const HYBRID_REPORT = path.join(REPORTS_DIR, "hybrid-run-report.json");
const FAILURE_REPORT = path.join(REPORTS_DIR, "FAILURE_REPORT.md");

function safeJsonLoad(p, def = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return def;
  }
}

function generateFailureReport() {
  const hybridReport = safeJsonLoad(HYBRID_REPORT);
  
  if (!hybridReport) {
    console.error("❌ No hybrid run report found");
    process.exit(1);
  }
  
  const failed = hybridReport.binders.filter(b => 
    b.status === "failed" || b.status === "config_hub_failed"
  );
  
  if (failed.length === 0) {
    console.log("✅ No failures to report");
    return;
  }
  
  const markdown = [
    "# Binder Execution Failure Report",
    "",
    `**Generated:** ${new Date().toISOString()}`,
    `**Total Binders:** ${hybridReport.total_binders}`,
    `**Failed:** ${failed.length}`,
    `**Success Rate:** ${hybridReport.success_rate}%`,
    "",
    "---",
    "",
    "## Failed Binders",
    ""
  ];
  
  failed.forEach((binder, idx) => {
    markdown.push(`### ${idx + 1}. ${binder.binder}`);
    markdown.push("");
    markdown.push(`**Status:** ${binder.status}`);
    markdown.push(`**Pre-validation:** ${binder.preValidation?.detected || 0} items detected`);
    
    if (binder.error) {
      markdown.push("");
      markdown.push("**Error:**");
      markdown.push("```");
      markdown.push(binder.error);
      markdown.push("```");
    }
    
    if (binder.attempts) {
      markdown.push("");
      markdown.push(`**Attempted methods:** ${binder.attempts.join(", ")}`);
    }
    
    markdown.push("");
    markdown.push("**Recommended Actions:**");
    
    // Provide specific recommendations based on error patterns
    if (binder.error?.includes("ENOENT")) {
      markdown.push("- ✅ Check that the binder file exists and is readable");
      markdown.push("- ✅ Verify file path is correct");
    } else if (binder.error?.includes("memory")) {
      markdown.push("- ✅ Increase Node.js memory limit (currently 8GB)");
      markdown.push("- ✅ Process binder in smaller chunks");
      markdown.push("- ✅ Close other applications to free RAM");
    } else if (binder.error?.includes("timeout")) {
      markdown.push("- ✅ Increase timeout limit");
      markdown.push("- ✅ Check for infinite loops in generator");
    } else if (binder.preValidation?.detected === 0) {
      markdown.push("- ✅ Binder appears empty - verify content");
      markdown.push("- ✅ Check detection patterns in _patterns.js");
    } else {
      markdown.push("- ✅ Review binder content for syntax errors");
      markdown.push("- ✅ Check generator logs for specific errors");
      markdown.push("- ✅ Try running binder individually: `node scripts/simple-api-generator.js \"path/to/binder.md\"`");
    }
    
    markdown.push("");
    markdown.push("---");
    markdown.push("");
  });
  
  markdown.push("## System Information");
  markdown.push("");
  markdown.push(`- **Node Version:** ${process.version}`);
  markdown.push(`- **Platform:** ${process.platform}`);
  markdown.push(`- **Memory Limit:** 8192MB`);
  markdown.push(`- **Execution Time:** ${hybridReport.duration_seconds}s`);
  markdown.push("");
  
  markdown.push("## Next Steps");
  markdown.push("");
  markdown.push("1. Review each failed binder above");
  markdown.push("2. Apply recommended actions");
  markdown.push("3. Re-run hybrid executor: `npm run hybrid:binders`");
  markdown.push("4. If issues persist, run individual binder for debugging");
  markdown.push("");
  markdown.push("## Manual Retry Commands");
  markdown.push("");
  
  failed.forEach(binder => {
    const binderPath = `C:/Users/chris/OneDrive/Desktop/binderfiles/${binder.binder}`;
    markdown.push(`\`\`\`bash`);
    markdown.push(`# Retry ${binder.binder}`);
    markdown.push(`node scripts/simple-api-generator.js "${binderPath}"`);
    markdown.push(`\`\`\``);
    markdown.push("");
  });
  
  const content = markdown.join("\n");
  fs.writeFileSync(FAILURE_REPORT, content);
  
  console.log(`\n📄 Failure report generated: ${FAILURE_REPORT}`);
  console.log("\nFailed binders:");
  failed.forEach(b => console.log(`  - ${b.binder}`));
}

generateFailureReport();

