# scripts/git_guard.ps1
# Git Guard: Batched, meaningful commits for large changesets

Param([int]$BatchSize = 2500)

$ErrorActionPreference = "Stop"

function Commit-IfAny($title) {
    $pending = (git diff --cached --name-only | Measure-Object -Line).Lines
    if ($pending -gt 0) {
        git commit -m $title --no-verify
        Write-Host "Committed: $title ($pending files)"
    }
}

# Helper: stage paths in batches
function Add-In-Batches($paths, $label) {
    $chunk = New-Object System.Collections.ArrayList
    $i = 0
    foreach($p in $paths) {
        [void]$chunk.Add($p)
        $i++
        if($i -ge $BatchSize) {
            git add -- $chunk 2>$null
            Commit-IfAny "feat($label): staged $i files"
            $chunk.Clear() | Out-Null
            $i = 0
        }
    }
    if($chunk.Count -gt 0) {
        git add -- $chunk 2>$null
        Commit-IfAny "feat($label): staged $($chunk.Count) files"
    }
}

Write-Host "Starting Git Guard batched commits..."

# 1) Always stage metadata first
Write-Host "Stage 1: Metadata files..."
git add .gitignore .gitattributes package.json package-lock.json yarn.lock pnpm-lock.yaml 2>$null
Commit-IfAny "chore(git-guard): normalize ignore & attributes"

# 2) Stage by categories (adjust as present)
$categories = @(
    @{ label="scripts";   glob=@("scripts/**") },
    @{ label="config";    glob=@("ops/**","src/config/**",".vscode/**") },
    @{ label="api";       glob=@("src/pages/api/**") },
    @{ label="ui";        glob=@("src/app/**","src/pages/**","!src/pages/api/**") },
    @{ label="lib";       glob=@("src/lib/**","src/middleware/**") },
    @{ label="types";     glob=@("src/types/**") },
    @{ label="tests";     glob=@("tests/**","__tests__/**") },
    @{ label="reports";   glob=@("ops/reports/**","ops/logs/**") },
    @{ label="assets";    glob=@("public/**","attached_assets/**","*.png","*.jpg","*.webp","*.pdf","*.zip") }
)

foreach($cat in $categories) {
    Write-Host "Stage 2: Processing category '$($cat.label)'..."
    $all = @()
    foreach($g in $cat.glob) {
        $found = git ls-files -m -o --exclude-standard -- $g 2>$null
        if ($found) {
            $all += $found
        }
    }
    if($all.Count -gt 0) {
        Write-Host "  Found $($all.Count) files in '$($cat.label)'"
        Add-In-Batches $all $cat.label
    }
}

# 3) Anything else modified
Write-Host "Stage 3: Remaining files..."
$rest = git status --porcelain=v1 | ForEach-Object { ($_ -split '\s+')[1] } | Where-Object { $_ -and (Test-Path $_) } | Where-Object { -not (git ls-files --error-unmatch $_ 2>$null) }
$tracked = git status --porcelain=v1 | Where-Object { $_ -match '^(M|A|R|C|D)' } | ForEach-Object { ($_ -split '\s+')[1] }
$remaining = @()
$remaining += $tracked
$remaining += $rest
$remaining = $remaining | Sort-Object -Unique

if($remaining.Count -gt 0) {
    Write-Host "  Found $($remaining.Count) remaining files"
    Add-In-Batches $remaining "misc"
}

# Final sanity commit if anything staged
Commit-IfAny "chore(git-guard): final batch"

Write-Host "Git Guard batched commits complete!"

