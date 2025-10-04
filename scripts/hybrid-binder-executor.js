#!/usr/bin/env node
// scripts/hybrid-binder-executor.js
// Hybrid orchestrator: executes all binders sequentially with auto-fallback and validation
import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { detectCounts } from "./_patterns.js";

const BASE_DIR = "C:/Users/chris/OneDrive/Desktop/binderfiles";
const REPORTS_DIR = "ops/reports";
const REPORT_PATH = path.join(REPORTS_DIR, "hybrid-run-report.json");
const MAX_MEMORY_MB = 8192;

// Ensure reports directory exists
fs.mkdirSync(REPORTS_DIR, { recursive: true });

function log(msg, level = "info") {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: "ℹ️",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    progress: "▶️"
  }[level] || "•";
  console.log(`[${timestamp}] ${prefix} ${msg}`);
}

function safeExec(cmd, label, options = {}) {
  try {
    log(`Executing: ${label}`, "progress");
    execSync(cmd, { 
      stdio: options.silent ? "pipe" : "inherit",
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer
      ...options
    });
    return { success: true };
  } catch (err) {
    return { 
      success: false, 
      error: err.message,
      stderr: err.stderr?.toString() || "",
      stdout: err.stdout?.toString() || ""
    };
  }
}

function getBinderFiles() {
  if (!fs.existsSync(BASE_DIR)) {
    throw new Error(`Binder directory not found: ${BASE_DIR}`);
  }
  
  const files = fs.readdirSync(BASE_DIR)
    .filter(f => f.toLowerCase().endsWith(".md"))
    .sort((a, b) => {
      // Extract numbers for proper sorting (binder1, binder2, ..., binder10, etc.)
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });
  
  log(`Found ${files.length} binder files in ${BASE_DIR}`, "info");
  return files;
}

function preValidateBinder(binderPath, binderName) {
  try {
    const content = fs.readFileSync(binderPath, "utf8");
    const counts = detectCounts(content);
    
    log(`Pre-validation: ${binderName} - ${counts.total} items detected`, "info");
    
    return {
      detected: counts.total,
      primary: counts.primary,
      fallback: counts.fallback,
      hasContent: counts.total > 0
    };
  } catch (err) {
    log(`Pre-validation failed for ${binderName}: ${err.message}`, "error");
    return { detected: 0, primary: 0, fallback: 0, hasContent: false, error: err.message };
  }
}

function executeBinder(binderPath, binderName) {
  log(`\n${"=".repeat(70)}`, "info");
  log(`Processing: ${binderName}`, "progress");
  log("=".repeat(70), "info");
  
  const preValidation = preValidateBinder(binderPath, binderName);
  
  // Skip if no content
  if (!preValidation.hasContent) {
    log(`Skipping ${binderName} - no detectable content`, "warning");
    return {
      binder: binderName,
      status: "skipped",
      reason: "no_content",
      preValidation
    };
  }
  
  // Special handling for Binder14 (config hub)
  if (/binder14/i.test(binderName)) {
    log(`Special handling: ${binderName} is config hub`, "info");
    const result = safeExec(
      `node scripts/binder-orchestrator-new.js`,
      "Binder14 config hub generation"
    );
    
    if (result.success) {
      return {
        binder: binderName,
        status: "config_hub_success",
        preValidation,
        method: "orchestrator"
      };
    } else {
      return {
        binder: binderName,
        status: "config_hub_failed",
        preValidation,
        error: result.error
      };
    }
  }
  
  // Try primary generator
  if (fs.existsSync("scripts/simple-api-generator.js")) {
    const result = safeExec(
      `node scripts/simple-api-generator.js "${binderPath}"`,
      `Primary generator for ${binderName}`
    );
    
    if (result.success) {
      log(`Successfully generated from ${binderName}`, "success");
      return {
        binder: binderName,
        status: "success",
        preValidation,
        method: "primary_generator"
      };
    } else {
      log(`Primary generator failed for ${binderName}`, "warning");
      // Fall through to retry logic
    }
  }
  
  // If we get here, primary failed or doesn't exist - try orchestrator
  log(`Attempting orchestrator fallback for ${binderName}`, "info");
  const orchResult = safeExec(
    `node scripts/binder-orchestrator-new.js`,
    `Orchestrator fallback for ${binderName}`
  );
  
  if (orchResult.success) {
    return {
      binder: binderName,
      status: "fallback_success",
      preValidation,
      method: "orchestrator"
    };
  }
  
  // All methods failed
  return {
    binder: binderName,
    status: "failed",
    preValidation,
    error: orchResult.error,
    attempts: ["primary_generator", "orchestrator"]
  };
}

function runValidation(phase) {
  log(`\nRunning ${phase} validation...`, "progress");
  const result = safeExec(
    `node scripts/validate-binders-new.js --phase ${phase}`,
    `${phase} validation`
  );
  
  if (result.success) {
    const reportPath = path.join(REPORTS_DIR, `validation_${phase}.json`);
    if (fs.existsSync(reportPath)) {
      const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));
      log(`${phase} validation: ${report.totalDetected} items detected`, "success");
      return { success: true, report };
    }
  }
  
  return { success: result.success, error: result.error };
}

function runGuard() {
  log("\nRunning binder guard...", "progress");
  const result = safeExec(
    `node scripts/guard-binders.js`,
    "Binder guard"
  );
  
  return result;
}

function generateReport(summary, startTime) {
  const endTime = Date.now();
  const duration = Math.round((endTime - startTime) / 1000);
  
  const report = {
    timestamp: new Date().toISOString(),
    duration_seconds: duration,
    total_binders: summary.length,
    successful: summary.filter(s => s.status === "success" || s.status === "fallback_success" || s.status === "config_hub_success").length,
    failed: summary.filter(s => s.status === "failed" || s.status === "config_hub_failed").length,
    skipped: summary.filter(s => s.status === "skipped").length,
    binders: summary,
    success_rate: Math.round((summary.filter(s => 
      s.status === "success" || 
      s.status === "fallback_success" || 
      s.status === "config_hub_success"
    ).length / summary.length) * 100)
  };
  
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  log(`Report saved to: ${REPORT_PATH}`, "success");
  
  return report;
}

function printSummary(report) {
  console.log("\n" + "=".repeat(70));
  console.log("  HYBRID BINDER EXECUTION SUMMARY");
  console.log("=".repeat(70) + "\n");
  
  console.table({
    "Total Binders": report.total_binders,
    "Successful": report.successful,
    "Failed": report.failed,
    "Skipped": report.skipped,
    "Success Rate": `${report.success_rate}%`,
    "Duration": `${report.duration_seconds}s`
  });
  
  if (report.failed > 0) {
    console.log("\n❌ Failed Binders:");
    report.binders
      .filter(b => b.status === "failed" || b.status === "config_hub_failed")
      .forEach(b => {
        console.log(`  - ${b.binder}: ${b.error || "unknown error"}`);
      });
  }
  
  if (report.skipped > 0) {
    console.log("\n⚠️  Skipped Binders:");
    report.binders
      .filter(b => b.status === "skipped")
      .forEach(b => {
        console.log(`  - ${b.binder}: ${b.reason}`);
      });
  }
  
  console.log("\n" + "=".repeat(70));
}

async function main() {
  const startTime = Date.now();
  
  log("🚀 HYBRID BINDER EXECUTOR - Starting", "progress");
  log(`Memory limit: ${MAX_MEMORY_MB}MB`, "info");
  log(`Base directory: ${BASE_DIR}`, "info");
  
  // Step 1: Pre-validation
  const preValidation = runValidation("pre");
  if (!preValidation.success) {
    log("Pre-validation failed, but continuing...", "warning");
  }
  
  // Step 2: Get binder files
  const binderFiles = getBinderFiles();
  const summary = [];
  
  // Step 3: Execute each binder
  for (const binderFile of binderFiles) {
    const binderPath = path.join(BASE_DIR, binderFile);
    const result = executeBinder(binderPath, binderFile);
    summary.push(result);
    
    // Brief pause between binders to allow system to stabilize
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Step 4: Post-validation
  const postValidation = runValidation("post");
  if (!postValidation.success) {
    log("Post-validation failed", "error");
  }
  
  // Step 5: Generate report
  const report = generateReport(summary, startTime);
  printSummary(report);
  
  // Step 6: Run guard if success rate is good
  if (report.success_rate >= 95) {
    log("\n✅ Success rate ≥95%, running guard...", "success");
    const guardResult = runGuard();
    
    if (guardResult.success) {
      log("\n🎉 ALL QUALITY GATES PASSED", "success");
      process.exit(0);
    } else {
      log("\n❌ Guard failed", "error");
      process.exit(2);
    }
  } else {
    log(`\n❌ Success rate ${report.success_rate}% < 95%, guard not run`, "error");
    log("Review failed binders and retry", "info");
    process.exit(1);
  }
}

// Run
main().catch(err => {
  log(`Fatal error: ${err.message}`, "error");
  console.error(err);
  process.exit(1);
});

