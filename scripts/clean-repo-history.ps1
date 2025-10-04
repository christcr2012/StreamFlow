# scripts/clean-repo-history.ps1
# Purpose: Permanently remove binder artifacts from Git history and push a slim repo to GitHub.
# Safe for repeat runs. Produces a report at docs/BINDER_HISTORY_CLEANUP.md.

# ------ Guardrails ------
$ErrorActionPreference = "Stop"

function Log($msg){ Write-Host ("[clean] " + $msg) -ForegroundColor Cyan }
function Fail($msg){ Write-Host ("[clean:ERROR] " + $msg) -ForegroundColor Red; exit 1 }

# 0) Sanity checks -------------------------------------------------------------
if (!(Test-Path ".git")) { Fail "Run this from the repo root (no .git found)." }

# Require git
git --version | Out-Null

# Detect remote
$remote = (git remote get-url origin) 2>$null
if (!$remote) { Fail "No 'origin' remote found. Add one before running." }

# Current branch & dirty check
$branch = (git rev-parse --abbrev-ref HEAD).Trim()
$dirty = (git status --porcelain)
if ($dirty) { Fail "Working tree is dirty. Commit or stash changes first." }

# 1) Optional: create a safety tag & branch snapshot --------------------------
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupTag = "pre-clean-$timestamp"
$backupBranch = "backup/pre-clean-$timestamp"

Log "Creating safety tag ($backupTag) and branch ($backupBranch)…"
git tag $backupTag
git branch $backupBranch

# 2) Ensure Python + git-filter-repo ------------------------------------------
function Ensure-Python {
  try { python --version | Out-Null; return $true } catch { return $false }
}

function Ensure-FilterRepo {
  try { git filter-repo --help | Out-Null; return $true } catch { return $false }
}

if (!(Ensure-Python)) {
  Log "Python not found. Attempting install via winget (may prompt)…"
  try {
    winget install -e --id Python.Python.3 -h
  } catch {
    Fail "Python is required. Install Python 3, then re-run."
  }
}

if (!(Ensure-FilterRepo)) {
  Log "Installing git-filter-repo via pip for current user…"
  python -m pip install --user git-filter-repo

  # Add user Scripts path for this session (try multiple Python versions)
  $pythonVersions = @("Python313", "Python312", "Python311", "Python310", "Python39")
  foreach ($ver in $pythonVersions) {
    $userScripts = Join-Path $env:USERPROFILE "AppData\Roaming\Python\$ver\Scripts"
    if (Test-Path $userScripts) {
      $env:PATH = "$env:PATH;$userScripts"
      Log "Added $userScripts to PATH"
      break
    }
  }

  if (!(Ensure-FilterRepo)) { Fail "git-filter-repo still not available after install." }
}

# 3) Measure size before -------------------------------------------------------
function Git-Bytes {
  # Size of .git directory in bytes (PowerShell, Windows-safe)
  $sum = 0
  Get-ChildItem -Path ".git" -Recurse -Force -ErrorAction SilentlyContinue | ForEach-Object { $sum += ($_.Length) }
  return $sum
}

$sizeBefore = Git-Bytes
Log ("Repo .git size before: {0:N0} bytes" -f $sizeBefore)

# 4) Rewrite history (remove binder artifacts + huge blobs) -------------------
# Paths to excise entirely from history:
$pathsToPurge = @(
  "binderFiles/",
  "ops/manifests/")

# Build args: one --path per item with --invert-paths to drop them.
$pathArgs = @()
foreach ($p in $pathsToPurge) { $pathArgs += @("--path", $p, "--invert-paths") }

# Also strip any blob > 95MB (safety for any accidentally committed large files)
$stripArg = @("--strip-blobs-bigger-than", "95M")

Log "Running git-filter-repo to purge paths and strip huge blobs…"
# Single pass with all options:
& git filter-repo @pathArgs @stripArg --force

# 5) Expire reflogs & garbage collect -----------------------------------------
Log "Expiring reflogs and running aggressive GC…"
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 6) Measure size after --------------------------------------------------------
$sizeAfter = Git-Bytes
$reclaimed = $sizeBefore - $sizeAfter
Log ("Repo .git size after:  {0:N0} bytes" -f $sizeAfter)
Log ("Space reclaimed:        {0:N0} bytes" -f $reclaimed)

# 7) Ensure binder outputs are ignored going forward --------------------------
if (!(Test-Path ".gitignore")) { New-Item -ItemType File .gitignore | Out-Null }

$ignoreLines = @(
  "binderFiles/",
  "ops/manifests/",
  "*.manifest.json",
  "*.manifest.ndjson")

$gi = Get-Content .gitignore -ErrorAction SilentlyContinue
$missing = $ignoreLines | Where-Object { $_ -notin $gi }

if ($missing.Count -gt 0) {
  Add-Content .gitignore ("`n# Binder artifacts (cleaned by clean-repo-history.ps1)")
  $missing | ForEach-Object { Add-Content .gitignore $_ }
  git add .gitignore
  git commit -m "chore: ignore binder artifacts going forward [skip ci]" | Out-Null
  Log "Updated .gitignore with binder artifact rules."
}

# 8) Push rewritten history (force) -------------------------------------------
Log "Force-pushing rewritten history to origin…"
git push origin --force --all
git push origin --force --tags

# 9) Write a small report for the repo ----------------------------------------
New-Item -ItemType Directory -Force -Path "docs" | Out-Null

$report = @"
# Binder History Cleanup Report

- Timestamp: $((Get-Date).ToString("u"))
- Branch cleaned: $branch
- Safety tag created: $backupTag
- Safety branch created: $backupBranch

## Paths removed from history

$($pathsToPurge | ForEach-Object { "- $_" } | Out-String)

## Size

- .git size before: $("{0:N0}" -f $sizeBefore) bytes
- .git size after:  $("{0:N0}" -f $sizeAfter) bytes
- Reclaimed:        $("{0:N0}" -f $reclaimed) bytes

> Note: All collaborators must **re-clone** the repository after this change because history was rewritten.
"@

$reportPath = "docs/BINDER_HISTORY_CLEANUP.md"
Set-Content -Path $reportPath -Value $report -Encoding UTF8

git add $reportPath
git commit -m "docs: binder history cleanup report [skip ci]" | Out-Null
git push origin $branch

Log "✅ Done! Report written to $reportPath"
Log "Safety backup: tag=$backupTag, branch=$backupBranch"
