/**
 * Trace Matrix Updater (Scaffold)
 *
 * For now, this script prints a notice and exits successfully.
 * In Phase 1, we'll implement schema scanning and code mapping.
 */
import { existsSync, writeFileSync } from "fs";
import { readFileSync } from "fs";

const TRACE_PATH = "docs/trace-matrix.md";

function main() {
  if (!existsSync(TRACE_PATH)) {
    console.log("ℹ️  No trace-matrix.md found. Skipping update for now.");
    process.exit(0);
  }

  const content = readFileSync(TRACE_PATH, "utf-8");
  const banner = `\n\n<!-- Updated: ${new Date().toISOString()} (scaffold) -->\n`;
  if (!content.includes("(scaffold)")) {
    writeFileSync(TRACE_PATH, content + banner, "utf-8");
    console.log("✅ Trace matrix touched (scaffold).");
  } else {
    console.log("✅ Trace matrix already has scaffold banner.");
  }
}

main();
