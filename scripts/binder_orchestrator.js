/**
 * Binder Orchestrator (Windows-friendly)
 * See README at top of file for full details.
 */
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawnSync } = require("child_process");
const readline = require("readline");

const CONFIG = {
  BINDER_DIR: "C:\\Users\\chris\\OneDrive\\Desktop\\binderfiles",
  API_DIRS: ["src/pages/api", "src/app/api"],
  REPORT_DIR: path.join("ops", "reports"),
  LOG_DIR: path.join("ops", "logs"),
  TARGET_COMPLETION: 90,
  READ_CHUNK_BYTES: 1024 * 1024 * 8,
  PROCESSORS: {
    CONTRACT: "scripts/system-contract-processor.js",
    LEGACY_API: "scripts/process-binder2.js",
    FRONTEND: "scripts/process-frontend-pack.js",
    GENERIC: "scripts/system-contract-processor.js",
  },
  FLAVOR_HINTS: {
    CONTRACT: [/system\s*contract/i, /###\s*endpoint\b/i, /Path:\s*\/api\//i],
    LEGACY_API: [/binder2/i, /\bAPI endpoints\b/i, /\bendpoint\s+\d+\b/i],
    FRONTEND: [/front[-\s]*end/i, /\bUI\b|\bReact\b|\bNext\.js\b/i, /screens?:/i],
  },
  ENDPOINT_PATTERNS: [
    /^\/api\/[-A-Za-z0-9_\/{}\\[\]]+/,
    /^\s*(Path|Endpoint)\s*:\s*\/api\/[^\s]+/i,
    /^\s*\|\s*\/api\/[^\s\|]+/i,
  ],
  FILE_EXTS: [".ts", ".tsx", ".js"],
  COUNT_WEBHOOKS: true,
  WEBHOOK_PATTERNS: [/webhook/i],
  COUNT_TESTS: true,
  TEST_PATTERNS: [/^test[-_\s]?\d+/i, /###\s*test\b/i],
};

const ensureDir = (p) => { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); };
const fileExists = (p) => fs.existsSync(p) && fs.statSync(p).isFile();
const dirExists = (p) => fs.existsSync(p) && fs.statSync(p).isDirectory();
const norm = (p) => p.replace(/\\/g, "/");

function listBinderFiles(dir) {
  if (!dirExists(dir)) throw new Error(`Binder directory not found: ${dir}`);
  return fs.readdirSync(dir)
    .filter((f) => /binder.*_FULL\.md$/i.test(f))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    .map((f) => path.join(dir, f));
}

function detectFlavor(sampleText, filename) {
  const txt = sampleText || ""; const name = filename.toLowerCase();
  if (/binder2/.test(name)) return "LEGACY_API";
  if (/3a|3b|3c/.test(name)) return "FRONTEND";
  if (CONFIG.FLAVOR_HINTS.CONTRACT.some((rx) => rx.test(txt))) return "CONTRACT";
  if (CONFIG.FLAVOR_HINTS.FRONTEND.some((rx) => rx.test(txt))) return "FRONTEND";
  if (CONFIG.FLAVOR_HINTS.LEGACY_API.some((rx) => rx.test(txt))) return "LEGACY_API";
  return "GENERIC";
}

async function streamCountPatterns(filePath, regexList) {
  let count = 0;
  const rl = readline.createInterface({
    input: fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: CONFIG.READ_CHUNK_BYTES }),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    for (const rx of regexList) { if (rx.test(line)) { count++; break; } }
  }
  return count;
}

async function readSample(filePath, bytes = 2048 * 10) {
  return new Promise((resolve, reject) => {
    const stream = fs.createReadStream(filePath, { encoding: "utf8", highWaterMark: bytes });
    let data = "";
    stream.on("data", (chunk) => { data += chunk; if (data.length >= bytes) stream.close(); });
    stream.on("close", () => resolve(data));
    stream.on("error", reject);
  });
}

function countActualApiFiles() {
  const roots = CONFIG.API_DIRS.filter(dirExists);
  let total = 0; const byDir = {};
  for (const root of roots) {
    let dirCount = 0;
    const walk = (d) => {
      for (const name of fs.readdirSync(d)) {
        const full = path.join(d, name); const st = fs.statSync(full);
        if (st.isDirectory()) walk(full);
        else if (CONFIG.FILE_EXTS.some((ext) => full.endsWith(ext))) dirCount++;
      }
    };
    walk(root); total += dirCount; byDir[root] = dirCount;
  }
  return { total, byDir };
}

function execNodeScript(scriptPath, args = []) {
  if (!fileExists(scriptPath)) return { ok: false, error: `Processor not found: ${scriptPath}` };
  const cmd = process.platform.startsWith("win") ? "node.exe" : "node";
  const res = spawnSync(cmd, [scriptPath, ...args], { stdio: "inherit", shell: false });
  return { ok: res.status === 0, status: res.status ?? -1 };
}

async function auditAllBinders(label) {
  const files = listBinderFiles(CONFIG.BINDER_DIR); const rows = [];
  for (const file of files) {
    const sample = await readSample(file);
    const flavor = detectFlavor(sample, path.basename(file));
    const expectedEndpoints = await streamCountPatterns(file, CONFIG.ENDPOINT_PATTERNS);
    const expectedWebhooks = CONFIG.COUNT_WEBHOOKS ? await streamCountPatterns(file, CONFIG.WEBHOOK_PATTERNS) : 0;
    const expectedTests = CONFIG.COUNT_TESTS ? await streamCountPatterns(file, CONFIG.TEST_PATTERNS) : 0;
    const { total: actualEndpoints, byDir } = countActualApiFiles();
    const completionPercent = expectedEndpoints ? Math.min(100, Math.round((actualEndpoints / expectedEndpoints) * 10000) / 100) : 0;
    rows.push({
      binder: path.basename(file), flavor, expectedEndpoints, actualEndpoints,
      completionPercent, expectedWebhooks, expectedTests, apiByDir: byDir,
      timestamp: new Date().toISOString(), phase: label,
    });
  }
  return rows;
}

function chooseProcessor(flavor) {
  const p = CONFIG.PROCESSORS;
  if (flavor === "CONTRACT") return p.CONTRACT;
  if (flavor === "LEGACY_API") return p.LEGACY_API;
  if (flavor === "FRONTEND") return p.FRONTEND;
  return p.GENERIC;
}

function writeReports(preRows, postRows) {
  ensureDir(CONFIG.REPORT_DIR);
  const jsonPath = path.join(CONFIG.REPORT_DIR, "binder_audit.json");
  const mdPath = path.join(CONFIG.REPORT_DIR, "binder_audit.md");
  const data = { pre: preRows, post: postRows, target: CONFIG.TARGET_COMPLETION, generatedAt: new Date().toISOString() };
  fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2), "utf8");
  const toLine = (r) => `| ${r.binder} | ${r.flavor} | ${r.expectedEndpoints} | ${r.actualEndpoints} | ${r.completionPercent}% | ${r.expectedWebhooks} | ${r.expectedTests} |`;
  const preTable = preRows.map(toLine).join("\n"); const postTable = postRows.map(toLine).join("\n");
  const md = `# Binder Audit Report

**Target completion:** ${CONFIG.TARGET_COMPLETION}%  
Generated: ${new Date().toLocaleString()}

## Pre-Audit
| Binder | Flavor | Expected Endpoints | Actual Endpoints | Completion | Expected Webhooks | Expected Tests |
|---|---|---:|---:|---:|---:|---:|
${preTable}

## Post-Audit
| Binder | Flavor | Expected Endpoints | Actual Endpoints | Completion | Expected Webhooks | Expected Tests |
|---|---|---:|---:|---:|---:|---:|
${postTable}
`;
  fs.writeFileSync(mdPath, md, "utf8");
  console.log(`\n✅ Reports written:\n - ${norm(jsonPath)}\n - ${norm(mdPath)}\n`);
}

async function main() {
  ensureDir(CONFIG.LOG_DIR); ensureDir(CONFIG.REPORT_DIR);
  console.log("\n🔎 PRE-AUDIT\n");
  const pre = await auditAllBinders("pre");
  const needs = pre.filter((r) => r.expectedEndpoints > 0 && r.completionPercent < CONFIG.TARGET_COMPLETION);

  if (!needs.length) {
    console.log("🎉 All binders meet the target. Writing pre==post report.");
    writeReports(pre, pre); process.exit(0);
  }

  console.log(`\n⚠️ ${needs.length} binder(s) below target. Reprocessing…\n`);
  for (const row of needs) {
    const binderPath = path.join(CONFIG.BINDER_DIR, row.binder);
    const processor = chooseProcessor(row.flavor);
    const logPath = path.join(CONFIG.LOG_DIR, `binder_reprocess_${row.binder.replace(/[^a-z0-9]+/gi, "_")}.log`);
    console.log(`▶ ${row.binder} → ${processor}`);
    const res = execNodeScript(processor, [binderPath]);
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${row.binder} -> ${res.ok ? "OK" : "FAIL"}${os.EOL}`);
  }

  console.log("\n🔁 POST-AUDIT\n");
  const post = await auditAllBinders("post");
  writeReports(pre, post);

  const stillLow = post.filter((r) => r.expectedEndpoints > 0 && r.completionPercent < CONFIG.TARGET_COMPLETION);
  if (stillLow.length) { console.log(`\n⚠️ ${stillLow.length} binder(s) still below target.`); process.exitCode = 2; }
  else { console.log("\n✅ All binder endpoints meet target completion."); }
}

if (require.main === module) {
  main().catch((e) => { console.error("Fatal orchestrator error:", e); process.exit(1); });
}

