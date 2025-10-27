#!/usr/bin/env tsx
/**
 * Sync Placeholder Issues
 *
 * Reads .ai-placeholders/github-issues.json and ensures a corresponding
 * GitHub issue exists for each blocked placeholder. Uses a stable `id`
 * in the body to deduplicate. Requires GITHUB_TOKEN and REPO env vars.
 *
 * Safe defaults: dry-run unless SYNC_ISSUES=true. When dry-run, prints the
 * issues that would be created. When syncing, creates open issues labeled
 * accordingly and skips those already existing.
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
const TRACKING_DIR = join(ROOT, ".ai-placeholders");
const ISSUES_PATH = join(TRACKING_DIR, "github-issues.json");

async function main() {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY || process.env.REPO; // e.g. owner/repo
  const dryRun = process.env.SYNC_ISSUES !== "true";

  if (!repo) {
    console.log("ℹ️  No REPO/GITHUB_REPOSITORY provided; skipping issue sync");
    process.exit(0);
  }

  let issues: IssuePayload[] = [];
  try {
    const raw = readFileSync(ISSUES_PATH, "utf-8");
    issues = JSON.parse(raw) as IssuePayload[];
  } catch (e) {
    console.log("ℹ️  No github-issues.json found; run ci:placeholders first.");
    process.exit(0);
  }

  if (issues.length === 0) {
    console.log("✅ No blocked placeholders to sync.");
    process.exit(0);
  }

  // In dry-run, just print a summary
  if (dryRun) {
    console.log(`🔎 Dry run: would sync ${issues.length} issues for ${repo}`);
    for (const it of issues) {
      console.log(`- [id:${it.id}] ${it.title}`);
    }
    process.exit(0);
  }

  if (!token) {
    console.error("❌ SYNC_ISSUES=true but GITHUB_TOKEN not set.");
    process.exit(1);
  }

  const [owner, name] = repo.split("/");
  const apiBase = "https://api.github.com";

  // naive cache of existing issues containing our id marker in the body
  // We search the last 100 open issues labeled 'placeholder' to reduce API calls
  const searchLabel = "placeholder";

  async function fetchExisting(): Promise<Record<string, number>> {
    const url = `${apiBase}/repos/${owner}/${name}/issues?state=open&labels=${encodeURIComponent(searchLabel)}&per_page=100`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "placeholder-sync-script",
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to list issues: ${res.status} ${res.statusText}`);
    }
    const arr: any[] = await res.json();
    const map: Record<string, number> = {};
    for (const issue of arr) {
      if (typeof issue.body === "string") {
        const match = issue.body.match(/\n<!-- placeholder-id: (.+?) -->/);
        if (match) {
          map[match[1]] = issue.number;
        }
      }
    }
    return map;
  }

  async function createIssue(payload: IssuePayload) {
    // Append hidden id marker for dedupe
    const bodyWithId = `${payload.body}\n\n<!-- placeholder-id: ${payload.id} -->`;
    const url = `${apiBase}/repos/${owner}/${name}/issues`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "User-Agent": "placeholder-sync-script",
      },
      body: JSON.stringify({
        title: payload.title,
        body: bodyWithId,
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

  console.log(`🚀 Syncing ${issues.length} placeholder issues to ${repo}...`);
  const existing = await fetchExisting();
  let created = 0;
  let skipped = 0;

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
