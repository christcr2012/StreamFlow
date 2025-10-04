import { execSync } from "child_process";
const run = (cmd) => execSync(cmd, { stdio: "inherit" });

console.log("🔁 Pre-validation…");
run(`node scripts/validate-binders.js --phase pre --bindersRoot "C:/Users/chris/OneDrive/Desktop/binderfiles"`);

console.log("🚀 Orchestrator…");
run(`node scripts/binder_orchestrator.js`);

console.log("🔎 Post-validation & status…");
run(`node scripts/validate-binders.js --phase post --bindersRoot "C:/Users/chris/OneDrive/Desktop/binderfiles"`);
run(`node scripts/check-processing-status.js`);

console.log("🧪 TypeScript check…");
try { run(`npx tsc --noEmit --skipLibCheck`); } catch { process.exitCode = 2; }

console.log("🗄️ Prisma health…");
try { run(`npx prisma generate`); } catch { process.exitCode = 3; }

console.log("✅ Done. See ops/reports for results.");
