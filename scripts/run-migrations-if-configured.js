/*
Guarded Prisma migrations for Vercel/CI

Behavior:
- Only runs when RUN_DB_MIGRATIONS === 'true'
- Requires DATABASE_URL and DIRECT_DATABASE_URL to both be present
- Runs migrate deploy for both schemas (tenant + provider) in safe order
- Skips gracefully with informative logs otherwise
*/

const { spawnSync } = require("node:child_process");
const path = require("node:path");

function log(msg) {
  console.log(`[migrations] ${msg}`);
}

function run(cmd, args, opts = {}) {
  log(`> ${cmd} ${args.join(" ")}`);
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: false, ...opts });
  if (res.status !== 0) {
    throw new Error(`Command failed: ${cmd} ${args.join(" ")}`);
  }
}

function main() {
  const shouldRun =
    String(process.env.RUN_DB_MIGRATIONS || "false").toLowerCase() === "true";
  if (!shouldRun) {
    log("RUN_DB_MIGRATIONS not enabled. Skipping.");
    return;
  }

  const dbUrl = process.env.DATABASE_URL || "";
  const directUrl = process.env.DIRECT_DATABASE_URL || "";

  if (!dbUrl || !directUrl) {
    log(
      "DATABASE_URL or DIRECT_DATABASE_URL missing. Skipping migrations to avoid failures.",
    );
    return;
  }

  try {
    // Tenant schema first (root prisma/schema.prisma)
    const tenantSchema = path.join(process.cwd(), "prisma", "schema.prisma");
    run("npx", ["prisma", "migrate", "deploy", `--schema=${tenantSchema}`]);

    // Provider schema next (apps/provider-portal/prisma/schema.prisma)
    const providerSchema = path.join(
      process.cwd(),
      "apps",
      "provider-portal",
      "prisma",
      "schema.prisma",
    );
    run("npx", ["prisma", "migrate", "deploy", `--schema=${providerSchema}`]);

    log("Migrations applied successfully.");
  } catch (err) {
    // Do not crash builds if database is not accessible; surface error and continue.
    console.error("[migrations] Failed to apply migrations:", err.message);
    throw err; // If you prefer non-blocking, comment this out.
  }
}

main();
