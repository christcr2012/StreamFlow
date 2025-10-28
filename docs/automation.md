# Automation Handbook (CI/CD, DoD, Projects v2)

This repo is configured to minimize manual approvals and keep automation first‑party.

## Definition of Done (DoD) checklist
- A GitHub Actions workflow posts/updates a single DoD checklist comment on issues and PRs.
- It runs on issue/PR events and is idempotent (uses a hidden marker).
- Backfill: a manual workflow can apply the checklist to all open issues at once.

Checklist items:
- Implementation matches acceptance criteria
- Lint, typecheck, unit tests passing
- Tests added/updated to cover changes
- Security review (secrets, authN/Z, PII); CodeQL clean
- CI/CD updated if needed
- Docs updated as appropriate
- UX smoke checks (no 500s; key controls render; error/success states)

## Auto‑approve PRs
- Trusted actors (maintainer/bot) are auto‑approved and labeled `automerge`.
- Implementation uses `actions/github-script` with the default `GITHUB_TOKEN`.
- Repo settings: Actions have read/write and may create/approve PRs.

## Projects v2 (repo‑level)
- Board: "Cortiware – Now/Next/Later/Blocked" (repo‑owned, not user‑owned).
- Lane field (single‑select): Now / Next / Later / Blocked.
- Sync rules (issues → project):
  - If milestone contains "now/next/later/blocked", that wins.
  - Else use labels: `priority: now|next|later` or `blocked` (default: Later).
- Workflows:
  - Verify (manual) ensures the board exists and Lane options are correct.
  - Sync runs on issue events, a nightly cron, and manually.

## Operations
- Backfill DoD across open issues: run the Backfill workflow (manual).
- Verify Projects board: run the Verify workflow (manual).
- Force a full project sync: run the Sync workflow (manual).

## Notes
- No personal access tokens are required for these workflows (uses `GITHUB_TOKEN`).
- The legacy `BOT_HELPER_TOKEN` secret remains in the repo for potential future use but is not required by current workflows.

