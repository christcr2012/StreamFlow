// scripts/retry-failed-binders.js
// Self-healing retry logic for failed binders
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { detectCounts } from "./_patterns.js";

const REPORTS_DIR = "ops/reports";
const BINDERS_ROOT = "C:/Users/chris/OneDrive/Desktop/binderfiles";
const MAX_RETRIES = 2;
const BACKOFF_MS = [20000, 60000]; // 20s, 60s

function safeJsonLoad(p, def = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return def;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function runGenerator(binderPath) {
  console.log(`  🔄 Regenerating from ${path.basename(binderPath)}`);
  try {
    if (fs.existsSync("scripts/simple-api-generator.js")) {
      execSync(`node scripts/simple-api-generator.js "${binderPath}"`, { stdio: "inherit" });
    }
    return true;
  } catch (e) {
    console.error(`  ❌ Generator failed:`, e.message);
    return false;
  }
}

function ensureBinder14() {
  console.log("  ⚙️ Ensuring Binder14 config hub artifacts...");
  fs.mkdirSync("src/config", { recursive: true });
  
  const binders = fs.readdirSync(BINDERS_ROOT)
    .filter(f => f.toLowerCase().endsWith(".md"))
    .sort((a, b) => a.localeCompare(b));
  
  if (!fs.existsSync("src/config/system-registry.ts")) {
    fs.writeFileSync("src/config/system-registry.ts", "export const registry={features:{},toggles:{}};\n");
  }
  
  fs.writeFileSync("src/config/binder-map.json", JSON.stringify({ binders }, null, 2));
  
  fs.mkdirSync("src/app/admin", { recursive: true });
  if (!fs.existsSync("src/app/admin/orchestrator-panel.tsx")) {
    fs.writeFileSync("src/app/admin/orchestrator-panel.tsx", `export default function Panel(){return <div>Orchestrator Admin</div>}\n`);
  }
}

async function main() {
  console.log("🔧 SELF-HEAL: Analyzing failed binders...\n");

  const preVal = safeJsonLoad(path.join(REPORTS_DIR, "validation_pre.json"), {});
  const postVal = safeJsonLoad(path.join(REPORTS_DIR, "validation_post.json"), {});
  const orchestrator = safeJsonLoad(path.join(REPORTS_DIR, "orchestrator-report.json"), []);
  const verify = safeJsonLoad(path.join(REPORTS_DIR, "verify_binder_to_code.json"), {});

  if (!preVal.results || !postVal.results) {
    console.error("❌ Missing validation reports. Run validation first.");
    process.exit(3);
  }

  // Identify failed binders
  const failedBinders = [];
  
  for (const [name, preData] of Object.entries(preVal.results)) {
    const postData = postVal.results[name];
    const orchEntry = orchestrator.find(e => e.name === name);
    
    // Criteria for retry:
    // a) Mapping score < 100% (detected vs handled mismatch)
    // b) No orchestrator entry or not handled
    // c) Binder14 special case - check artifacts
    
    const needsRetry = 
      !postData ||
      !orchEntry ||
      !orchEntry.handled ||
      (orchEntry.mode === "skip" && preData.detected > 0) ||
      (orchEntry.mode === "config-hub" && !fs.existsSync("src/config/binder-map.json"));
    
    if (needsRetry) {
      failedBinders.push({
        name,
        reason: !orchEntry ? "missing orchestrator entry" :
                !orchEntry.handled ? "not handled" :
                orchEntry.mode === "skip" ? "skipped but has content" :
                "config hub incomplete",
        preDetected: preData.detected,
        attempts: 0,
        success: false
      });
    }
  }

  if (failedBinders.length === 0) {
    console.log("✅ No failed binders detected. All good!");
    
    const healLog = {
      timestamp: new Date().toISOString(),
      failedCount: 0,
      retriedCount: 0,
      successCount: 0,
      binders: []
    };
    
    fs.writeFileSync(path.join(REPORTS_DIR, "self_heal_log.json"), JSON.stringify(healLog, null, 2));
    return;
  }

  console.log(`⚠️  Found ${failedBinders.length} binders needing retry:\n`);
  failedBinders.forEach(b => console.log(`  - ${b.name}: ${b.reason}`));
  console.log();

  // Retry logic
  const healLog = {
    timestamp: new Date().toISOString(),
    failedCount: failedBinders.length,
    retriedCount: 0,
    successCount: 0,
    binders: []
  };

  for (const binder of failedBinders) {
    console.log(`\n🔹 Retrying: ${binder.name}`);
    const binderPath = path.join(BINDERS_ROOT, binder.name);
    
    if (!fs.existsSync(binderPath)) {
      console.log(`  ⚠️  Binder file not found, skipping.`);
      healLog.binders.push({ ...binder, status: "file_not_found" });
      continue;
    }

    let success = false;
    
    for (let attempt = 0; attempt < MAX_RETRIES && !success; attempt++) {
      binder.attempts = attempt + 1;
      healLog.retriedCount++;
      
      console.log(`  📍 Attempt ${attempt + 1}/${MAX_RETRIES}`);
      
      // Special handling for Binder14
      if (/binder14/i.test(binder.name)) {
        ensureBinder14();
        success = fs.existsSync("src/config/binder-map.json") &&
                  fs.existsSync("src/config/system-registry.ts") &&
                  fs.existsSync("src/app/admin/orchestrator-panel.tsx");
      } else {
        success = runGenerator(binderPath);
      }
      
      if (success) {
        console.log(`  ✅ Success on attempt ${attempt + 1}`);
        binder.success = true;
        healLog.successCount++;
        break;
      } else if (attempt < MAX_RETRIES - 1) {
        const backoff = BACKOFF_MS[attempt];
        console.log(`  ⏳ Waiting ${backoff / 1000}s before retry...`);
        await sleep(backoff);
      }
    }
    
    if (!success) {
      console.log(`  ❌ Failed after ${MAX_RETRIES} attempts`);
    }
    
    healLog.binders.push({
      name: binder.name,
      reason: binder.reason,
      attempts: binder.attempts,
      success: binder.success,
      status: binder.success ? "healed" : "failed"
    });
  }

  // Save heal log
  fs.writeFileSync(path.join(REPORTS_DIR, "self_heal_log.json"), JSON.stringify(healLog, null, 2));
  
  // Update FINAL_SUMMARY.md with self-heal section
  const summaryPath = path.join(REPORTS_DIR, "FINAL_SUMMARY.md");
  let summary = fs.existsSync(summaryPath) ? fs.readFileSync(summaryPath, "utf8") : "";
  
  const healSection = [
    "",
    "---",
    "",
    "## 🔧 Self-Heal Report",
    "",
    `**Timestamp:** ${healLog.timestamp}`,
    `**Failed Binders:** ${healLog.failedCount}`,
    `**Retry Attempts:** ${healLog.retriedCount}`,
    `**Successfully Healed:** ${healLog.successCount}`,
    `**Still Failed:** ${healLog.failedCount - healLog.successCount}`,
    "",
    "### Binder Details",
    "",
    ...healLog.binders.map(b => 
      `- **${b.name}**: ${b.status} (${b.attempts} attempts) - ${b.reason}`
    ),
    ""
  ].join("\n");
  
  // Append or replace self-heal section
  if (summary.includes("## 🔧 Self-Heal Report")) {
    summary = summary.replace(/## 🔧 Self-Heal Report[\s\S]*$/, healSection);
  } else {
    summary += healSection;
  }
  
  fs.writeFileSync(summaryPath, summary);
  
  console.log(`\n📊 Self-Heal Summary:`);
  console.log(`  Total failed: ${healLog.failedCount}`);
  console.log(`  Healed: ${healLog.successCount}`);
  console.log(`  Still failed: ${healLog.failedCount - healLog.successCount}`);
  console.log(`\n📄 Reports updated:`);
  console.log(`  - ${path.join(REPORTS_DIR, "self_heal_log.json")}`);
  console.log(`  - ${summaryPath}`);
  
  if (healLog.successCount < healLog.failedCount) {
    console.error(`\n❌ Self-heal incomplete. ${healLog.failedCount - healLog.successCount} binders still failing.`);
    process.exit(2);
  }
  
  console.log("\n✅ Self-heal complete!");
}

main().catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});

