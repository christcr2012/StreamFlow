#!/usr/bin/env tsx
/**
 * Sync Slice Issues
 *
 * Reads .ai-planning/slices-issues.json and ensures a corresponding
 * GitHub issue exists per slice. Uses a stable `id` comment to dedupe.
 * Requires GITHUB_TOKEN and GITHUB_REPOSITORY/REPO.
 * Dry run unless SYNC_SLICES=true
 */
import { readFileSync } from "fs";
import { join } from "path";

interface IssuePayload {
  id: string;
  title: string;
  body: string;
  labels: string[];
}

const ROOT = process.cwd();
const PLANNING = join(ROOT, ".ai-planning");
const FILE = join(PLANNING, "slices-issues.json");

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || process.env.REPO;
  const dry = process.env.SYNC_SLICES !== "true";

  let issues: IssuePayload[] = [];
  try {
    issues = JSON.parse(readFileSync(FILE, "utf-8")) as IssuePayload[];
  } catch {
    console.log("ℹ️  No slices-issues.json found; run npm run phase:0 first.");
    process.exit(0);
  }

  if (!repo) {
    console.log(
      "ℹ️  No REPO/GITHUB_REPOSITORY provided; skipping slice issue sync",
    );
    process.exit(0);
  }

  if (issues.length === 0) {
    console.log("✅ No slice issues to sync.");
    process.exit(0);
  }

  if (dry) {
    console.log(
      `🔎 Dry run: would sync ${issues.length} slice issues for ${repo}`,
    );
    for (const it of issues) console.log(`- [id:${it.id}] ${it.title}`);
    process.exit(0);
  }

  if (!token) {
    console.error("❌ SYNC_SLICES=true but GITHUB_TOKEN missing.");
    process.exit(1);
  }

  const [owner, name] = repo.split("/");
  const apiBase = "https://api.github.com";

  async function fetchExisting(): Promise<Record<string, number>> {
    const url = `${apiBase}/repos/${owner}/${name}/issues?state=open&labels=${encodeURIComponent("slice")}&per_page=100`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "slice-sync-script",
      },
    });
    if (!res.ok)
      throw new Error(`Failed to list issues: ${res.status} ${res.statusText}`);
    const arr: any[] = await res.json();
    const map: Record<string, number> = {};
    for (const issue of arr) {
      if (typeof issue.body === "string") {
        const match = issue.body.match(/\n<!-- slice-id: (.+?) -->/);
        if (match) map[match[1]] = issue.number;
      }
    }
    return map;
  }

  async function createIssue(payload: IssuePayload) {
    const body = `${payload.body}\n\n<!-- slice-id: ${payload.id} -->`;
    const url = `${apiBase}/repos/${owner}/${name}/issues`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "slice-sync-script",
      },
      body: JSON.stringify({
        title: payload.title,
        body,
        labels: payload.labels,
      }),
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(
        `Failed to create issue: ${res.status} ${res.statusText} - ${txt}`,
      );
    }
    const json = await res.json();
    return json.number as number;
  }

  console.log(`🚀 Syncing ${issues.length} slice issues to ${repo}...`);
  const existing = await fetchExisting();
  let created = 0,
    skipped = 0;
  for (const it of issues) {
    if (existing[it.id]) {
      skipped++;
      continue;
    }
    try {
      await createIssue(it);
      created++;
    } catch (e: any) {
      console.error(`Issue ${it.id} failed: ${e.message}`);
    }
  }
  console.log(`✅ Sync complete. Created: ${created}, Skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
