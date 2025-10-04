import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { detectCounts } from "./_patterns.js";

const ROOT = "C:/Users/chris/OneDrive/Desktop/binderfiles";
const binders = fs.readdirSync(ROOT).filter(f=>f.toLowerCase().endsWith(".md")).sort((a,b)=>a.localeCompare(b));

function run(cmd){ 
  console.log("▶", cmd); 
  try {
    execSync(cmd, { stdio:"inherit" });
  } catch(e) {
    console.warn("⚠️ Command failed but continuing:", cmd);
  }
}

function ensureBinder14(){
  fs.mkdirSync("src/config",{recursive:true});
  if(!fs.existsSync("src/config/system-registry.ts")) {
    fs.writeFileSync("src/config/system-registry.ts","export const registry={features:{},toggles:{}};\n");
  }
  fs.writeFileSync("src/config/binder-map.json", JSON.stringify({ binders }, null, 2));
  fs.mkdirSync("src/app/admin",{recursive:true});
  if(!fs.existsSync("src/app/admin/orchestrator-panel.tsx")){
    fs.writeFileSync("src/app/admin/orchestrator-panel.tsx",`export default function Panel(){return <div>Orchestrator Admin</div>}\n`);
  }
}

function processOne(name){
  console.log(`\n🔹 Processing ${name}`);
  const full = path.join(ROOT, name);
  const text = fs.readFileSync(full,"utf8");
  const c = detectCounts(text);

  if (/binder14/i.test(name)) {
    console.log("⚙️ Binder14: config hub generation");
    ensureBinder14();
    return { name, mode:"config-hub", counts:c, handled:true };
  }

  if (c.total===0) {
    console.log("⚠️ No detectable items — skip generation.");
    return { name, mode:"skip", counts:c, handled:false };
  }

  // Idempotent generators (call if present)
  try{
    if (fs.existsSync("scripts/simple-api-generator.js")) {
      run(`node scripts/simple-api-generator.js "${full}"`);
    }
    if (fs.existsSync("scripts/system-contract-processor.js")) {
      run(`node scripts/system-contract-processor.js "${full}"`);
    }
    if (fs.existsSync("scripts/frontend-pack.js")) {
      run(`node scripts/frontend-pack.js "${full}"`);
    }
    return { name, mode:"generated", counts:c, handled:true };
  }catch(e){
    console.error("❌ Generation error:", e.message || e);
    return { name, mode:"error", counts:c, handled:false, error:String(e.message||e) };
  }
}

console.log("🚀 Sequential binder execution starting…\n");

const report = binders.map(processOne);

fs.mkdirSync("ops/reports",{recursive:true});
fs.writeFileSync("ops/reports/orchestrator-report.json", JSON.stringify(report,null,2));

console.log("\n✅ Orchestration done → ops/reports/orchestrator-report.json");

