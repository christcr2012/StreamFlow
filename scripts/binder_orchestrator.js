import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BINDERS_ROOT = "C:/Users/chris/OneDrive/Desktop/binderfiles";
const isMd = (f) => f.toLowerCase().endsWith(".md");
const BINDERS = fs.readdirSync(BINDERS_ROOT).filter(isMd).sort((a,b)=>a.localeCompare(b));

const DETECTION_PATTERNS = {
  PRIMARY: /^#{3}\s*(API|SQL)\b.*$/i,
  FALLBACK: /\b(endpoint|route|verb|path|request|response|sql|query)\b/i,
};

function detectEndpoints(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  const lines = text.split(/\r?\n/);
  const primary = lines.filter(l => DETECTION_PATTERNS.PRIMARY.test(l)).length;
  const fallback = lines.filter(l => DETECTION_PATTERNS.FALLBACK.test(l)).length;
  return { primary, fallback, total: primary + fallback };
}

function ensureBinder14Artifacts(listing) {
  fs.mkdirSync("src/config", { recursive: true });
  fs.writeFileSync("src/config/binder-map.json", JSON.stringify({ binders: listing }, null, 2));
  if (!fs.existsSync("src/config/system-registry.ts")) {
    fs.writeFileSync("src/config/system-registry.ts", `export const registry = { features: {}, toggles: {} };\n`);
  }
  fs.mkdirSync("src/app/admin", { recursive: true });
  if (!fs.existsSync("src/app/admin/orchestrator-panel.tsx")) {
    fs.writeFileSync("src/app/admin/orchestrator-panel.tsx", `export default function Panel(){return <div>Orchestrator Admin</div>}\n`);
  }
}

function run(cmd) {
  console.log("▶", cmd);
  execSync(cmd, { stdio: "inherit" });
}

function processBinder(binderName) {
  const fullPath = path.join(BINDERS_ROOT, binderName);
  console.log(`\n🔹 Processing ${binderName}`);
  const endpoints = detectEndpoints(fullPath);

  if (/binder14/i.test(binderName)) {
    console.log("⚙️ Binder14: generating configuration hub artifacts…");
    ensureBinder14Artifacts(BINDERS);
    return { binder: binderName, endpoints, handled: true, mode: "config-hub" };
  }

  if (endpoints.total === 0) {
    console.log("⚠️ No endpoints detected. Skipping generation.");
    return { binder: binderName, endpoints, handled: false, mode: "skip" };
  }

  // Generators (keep idempotent)
  try {
    if (fs.existsSync("scripts/simple-api-generator.js")) {
      run(`node scripts/simple-api-generator.js "${fullPath}"`);
    }
    if (fs.existsSync("scripts/system-contract-processor.js")) {
      run(`node scripts/system-contract-processor.js "${fullPath}"`);
    }
    if (fs.existsSync("scripts/frontend-pack.js")) {
      run(`node scripts/frontend-pack.js "${fullPath}"`);
    }
    return { binder: binderName, endpoints, handled: true, mode: "generated" };
  } catch (err) {
    console.error("❌ Generation error:", err?.message || err);
    return { binder: binderName, endpoints, handled: false, mode: "error" };
  }
}

function main() {
  console.log("🚀 Sequential binder execution starting…");
  const report = BINDERS.map(processBinder);
  fs.mkdirSync("ops/reports", { recursive: true });
  fs.writeFileSync("ops/reports/orchestrator-report.json", JSON.stringify(report, null, 2));
  console.log("\n✅ Orchestration completed. Report: ops/reports/orchestrator-report.json");
}
main();
