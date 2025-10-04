import fs from "fs";
import path from "path";

const args = process.argv.slice(2);
const phase = args.find(a => a.startsWith('--phase'))?.split('=')[1] || 'pre';
const bindersRoot = args.find(a => a.startsWith('--bindersRoot'))?.split('=')[1] || 'C:/Users/chris/OneDrive/Desktop/binderfiles';

const PRIMARY_PATTERN = /^#{3}\s*(API|SQL)\b.*$/i;
const FALLBACK_PATTERN = /\b(endpoint|route|verb|path|request|response|sql|query)\b/i;

function detectContent(filePath) {
  try {
    const text = fs.readFileSync(filePath, "utf8");
    const lines = text.split(/\r?\n/);
    const primary = lines.filter(l => PRIMARY_PATTERN.test(l)).length;
    const fallback = lines.filter(l => FALLBACK_PATTERN.test(l)).length;
    return { primary, fallback, total: primary + fallback };
  } catch (err) {
    console.error(`❌ Error reading ${filePath}:`, err.message);
    return { primary: 0, fallback: 0, total: 0 };
  }
}

function getBinderFiles() {
  try {
    if (!fs.existsSync(bindersRoot)) {
      console.error(`❌ Binders root not found: ${bindersRoot}`);
      process.exit(1);
    }

    return fs.readdirSync(bindersRoot)
      .filter(f => f.toLowerCase().endsWith('.md'))
      .sort((a, b) => a.localeCompare(b));
  } catch (err) {
    console.error(`❌ Error reading binders directory: ${err.message}`);
    process.exit(1);
  }
}

function loadState() {
  const stateFile = `ops/reports/validation_${phase}.json`;
  try {
    if (fs.existsSync(stateFile)) {
      return JSON.parse(fs.readFileSync(stateFile, 'utf8'));
    }
    return {};
  } catch (err) {
    console.warn(`⚠️ Could not load state from ${stateFile}: ${err.message}`);
    return {};
  }
}

function saveState(state) {
  fs.mkdirSync('ops/reports', { recursive: true });
  const stateFile = `ops/reports/validation_${phase}.json`;
  fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  console.log(`📄 Saved validation state: ${stateFile}`);
}

function main() {
  console.log(`🔍 Running ${phase} validation from ${bindersRoot}`);

  const binderFiles = getBinderFiles();
  console.log(`📁 Found ${binderFiles.length} binder files`);

  const state = loadState();
  let totalDetected = 0;

  for (const binderFile of binderFiles) {
    const filePath = path.join(bindersRoot, binderFile);
    const detected = detectContent(filePath);

    state[binderFile] = {
      detected: detected.total,
      primary: detected.primary,
      fallback: detected.fallback,
      timestamp: new Date().toISOString()
    };

    totalDetected += detected.total;
    console.log(`  ${binderFile}: ${detected.total} items (${detected.primary} primary, ${detected.fallback} fallback)`);
  }

  saveState(state);

  const successRate = binderFiles.length > 0 ? (totalDetected / binderFiles.length) : 0;
  console.log(`\n📊 ${phase.toUpperCase()} SUMMARY:`);
  console.log(`  Binders processed: ${binderFiles.length}`);
  console.log(`  Total items detected: ${totalDetected}`);
  console.log(`  Average per binder: ${successRate.toFixed(1)}`);

  if (totalDetected === 0) {
    console.error('❌ No content detected in any binder files!');
    process.exit(1);
  }

  console.log('✅ Validation completed successfully');
}

main();