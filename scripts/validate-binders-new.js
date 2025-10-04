import fs from "fs";
import path from "path";
import { detectCounts } from "./_patterns.js";

const args = process.argv.join(" ");
const phase = /--phase\s+(\w+)/.exec(args)?.[1] || "pre";
const root = /--bindersRoot\s+"([^"]+)"/.exec(args)?.[1] || "C:/Users/chris/OneDrive/Desktop/binderfiles";

console.log(`🔍 Running ${phase} validation from ${root}`);

const entries = fs.readdirSync(root).filter(f => f.toLowerCase().endsWith(".md")).sort((a,b)=>a.localeCompare(b));

console.log(`📁 Found ${entries.length} binder files`);

let totalPre = 0;
let totalPost = 0;

const results = {};

for (const name of entries) {
  const p = path.join(root, name);
  const txt = fs.readFileSync(p, "utf8");
  const c = detectCounts(txt);
  
  if (phase === "pre") {
    totalPre += c.total;
  } else {
    totalPost += c.total;
  }
  
  results[name] = {
    detected: c.total,
    primary: c.primary,
    fallback: c.fallback
  };
  
  console.log(`  ${name}: ${c.total} items (${c.primary} primary, ${c.fallback} fallback)`);
}

fs.mkdirSync("ops/reports", { recursive: true });

const report = {
  phase,
  timestamp: new Date().toISOString(),
  totalDetected: phase === "pre" ? totalPre : totalPost,
  bindersCount: entries.length,
  results
};

fs.writeFileSync(`ops/reports/validation_${phase}.json`, JSON.stringify(report, null, 2));

console.log(`📄 Saved validation state: ops/reports/validation_${phase}.json`);
console.log(`\n📊 ${phase.toUpperCase()} SUMMARY:`);
console.log(`  Binders processed: ${entries.length}`);
console.log(`  Total items detected: ${phase === "pre" ? totalPre : totalPost}`);
console.log(`  Average per binder: ${((phase === "pre" ? totalPre : totalPre) / entries.length).toFixed(1)}`);

if ((phase === "pre" ? totalPre : totalPost) === 0) {
  console.error("❌ No content detected!");
  process.exit(1);
}

console.log("✅ Validation completed successfully");

