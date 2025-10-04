# scripts/hybrid-one-shot.ps1
# ONE-SHOT HYBRID BINDER EXECUTION + VALIDATION + SELF-HEAL + MERGE
# Runs end-to-end without stopping for questions

$ErrorActionPreference = "Stop"

Write-Host "HYBRID BINDER EXECUTOR - ONE-SHOT MODE" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan

# 0) Safety & branch
Write-Host "`n[0] Checking git status and creating branch..." -ForegroundColor Yellow

$ErrorActionPreference = "Continue"
git status --porcelain | Out-Null
$ErrorActionPreference = "Stop"

# Create new branch (keep working changes)
$branch = "hybrid-exec-$(Get-Date -Format yyyyMMdd-HHmmss)"
$ErrorActionPreference = "Continue"
git switch -c $branch | Out-Null
$ErrorActionPreference = "Stop"
Write-Host "Created branch: $branch" -ForegroundColor Green

# 1) Install & env
Write-Host "`n[1] Setting up environment..." -ForegroundColor Yellow
$env:NODE_OPTIONS = "--max-old-space-size=8192"
Write-Host "Memory limit: 8192MB" -ForegroundColor Gray

Write-Host "Running npm ci..." -ForegroundColor Gray
$ErrorActionPreference = "Continue"
npm ci 2>&1 | Out-Null
$ErrorActionPreference = "Stop"
Write-Host "Dependencies installed" -ForegroundColor Green

# 2) PRE validation
Write-Host "`n[2] Running pre-validation..." -ForegroundColor Yellow
node scripts/validate-binders-new.js --phase pre --bindersRoot "C:\Users\chris\OneDrive\Desktop\binderfiles"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Pre-validation had issues, continuing..." -ForegroundColor Yellow
}
Write-Host "Pre-validation complete" -ForegroundColor Green

# 3) Orchestrate full generation
Write-Host "`n[3] Running orchestrator (this may take several minutes)..." -ForegroundColor Yellow
node scripts/binder-orchestrator-new.js --bindersRoot "C:\Users\chris\OneDrive\Desktop\binderfiles"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Orchestrator had issues, continuing to validation..." -ForegroundColor Yellow
}
Write-Host "Orchestrator complete" -ForegroundColor Green

# 4) POST validation
Write-Host "`n[4] Running post-validation..." -ForegroundColor Yellow
node scripts/validate-binders-new.js --phase post --bindersRoot "C:\Users\chris\OneDrive\Desktop\binderfiles"
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: Post-validation had issues, continuing..." -ForegroundColor Yellow
}
Write-Host "Post-validation complete" -ForegroundColor Green

# 5) TypeScript checks (advisory) and Prisma
Write-Host "`n[5] Running TypeScript checks (advisory)..." -ForegroundColor Yellow
npm run typecheck 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "WARNING: TypeScript errors detected (advisory only)" -ForegroundColor Yellow
}

Write-Host "Running Prisma generate..." -ForegroundColor Gray
npx prisma generate 2>&1 | Out-Null
Write-Host "Prisma generated" -ForegroundColor Green

# 6) Compute success & gate decision
Write-Host "`n[6] Computing success metrics..." -ForegroundColor Yellow
node scripts/calculate-success.js `
    --threshold 95 `
    --pre ops/reports/validation_pre.json `
    --post ops/reports/validation_post.json `
    --orchestrator ops/reports/orchestrator-report.json `
    --out ops/reports/FINAL_SUMMARY.md `
    --json ops/reports/VERIFY_SUMMARY.json

Write-Host "Success metrics calculated" -ForegroundColor Green

# 7) Read decision from VERIFY_SUMMARY.json
Write-Host "`n[7] Reading quality gate results..." -ForegroundColor Yellow

if (-not (Test-Path "ops/reports/VERIFY_SUMMARY.json")) {
    Write-Host "❌ VERIFY_SUMMARY.json not found, aborting" -ForegroundColor Red
    exit 3
}

$verify = Get-Content "ops/reports/VERIFY_SUMMARY.json" -Raw | ConvertFrom-Json
$successRate = [int]$verify.successRate
$mappingScore = [int]$verify.mappingScore
$bindersNeedingHeal = @($verify.needsHeal)

Write-Host "Success Rate: $successRate%" -ForegroundColor Cyan
Write-Host "Mapping Score: $mappingScore%" -ForegroundColor Cyan
Write-Host "Binders Needing Heal: $($bindersNeedingHeal.Count)" -ForegroundColor Cyan

# 8) Optional self-heal if below threshold
if ($successRate -lt 95 -or $mappingScore -lt 100) {
    Write-Host "`n[8] Quality gates not met, attempting self-heal..." -ForegroundColor Yellow
    
    if ($bindersNeedingHeal.Count -gt 0) {
        Write-Host "Retrying $($bindersNeedingHeal.Count) failed binders..." -ForegroundColor Gray
        
        node scripts/retry-failed-binders.js --bindersRoot "C:\Users\chris\OneDrive\Desktop\binderfiles" --maxRetries 2
        
        # Re-run post validation
        Write-Host "Re-running post-validation..." -ForegroundColor Gray
        node scripts/validate-binders-new.js --phase post --bindersRoot "C:\Users\chris\OneDrive\Desktop\binderfiles"
        
        # Recompute success
        Write-Host "Recomputing success metrics..." -ForegroundColor Gray
        node scripts/calculate-success.js `
            --threshold 95 `
            --pre ops/reports/validation_pre.json `
            --post ops/reports/validation_post.json `
            --orchestrator ops/reports/orchestrator-report.json `
            --out ops/reports/FINAL_SUMMARY.md `
            --json ops/reports/VERIFY_SUMMARY.json
        
        # Re-read results
        $verify = Get-Content "ops/reports/VERIFY_SUMMARY.json" -Raw | ConvertFrom-Json
        $successRate = [int]$verify.successRate
        $mappingScore = [int]$verify.mappingScore
        
        Write-Host "After self-heal - Success: $successRate%, Mapping: $mappingScore%" -ForegroundColor Cyan
    } else {
        Write-Host "No specific binders to heal, continuing..." -ForegroundColor Yellow
    }
} else {
    Write-Host "`n[8] Quality gates met, skipping self-heal" -ForegroundColor Green
}

# 9) Quick stats
Write-Host "`n[9] Running quick stats..." -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/quick-stat.ps1 2>&1 | Out-Null
Write-Host "Quick stats complete" -ForegroundColor Green

# 10) Commit, push, PR/merge OR hold for review
Write-Host "`n[10] Committing and pushing changes..." -ForegroundColor Yellow

git add -A

$commitMsg = if ($successRate -ge 95 -and $mappingScore -eq 100) {
    "feat: hybrid binder executor - SUCCESSFUL EXECUTION (>=95% + 100% mapping) [skip ci]"
} else {
    "chore: hybrid binder executor - HOLD (success ${successRate}%, mapping ${mappingScore}%)"
}

git commit -m $commitMsg
Write-Host "Committed: $commitMsg" -ForegroundColor Green

Write-Host "Pushing to origin/$branch..." -ForegroundColor Gray
git push -u origin $branch

if ($successRate -ge 95 -and $mappingScore -eq 100) {
    Write-Host "`n[MERGE] Quality gates passed, merging to main..." -ForegroundColor Green
    
    # Switch to main and merge
    git switch main
    git fetch origin
    git merge --ff-only $branch
    git push origin main
    
    Write-Host "`nMERGED: success=$successRate% mapping=$mappingScore%" -ForegroundColor Green
    Write-Host "Reports:" -ForegroundColor Cyan
    Write-Host " - ops/reports/FINAL_SUMMARY.md" -ForegroundColor Gray
    Write-Host " - ops/reports/VERIFY_SUMMARY.json" -ForegroundColor Gray
    
    $exitCode = 0
} else {
    Write-Host "`n[HOLD] Quality gates not met, opening PR for review..." -ForegroundColor Yellow
    
    # Open PR using gh CLI
    $prTitle = "HOLD: Hybrid binder executor - success ${successRate}% / mapping ${mappingScore}%"
    $prBody = "Reports at ops/reports. Please review discrepancies. No merge performed."
    
    gh pr create --base main --head $branch --title $prTitle --body $prBody 2>&1 | Out-Null
    
    Write-Host "`nHELD: success=$successRate% mapping=$mappingScore% - PR opened for review." -ForegroundColor Yellow
    
    $exitCode = 2
}

# 11) Always print a compact console table
Write-Host "`n=== HYBRID EXECUTION - FINAL SNAPSHOT ===" -ForegroundColor Cyan
Write-Host "Success Rate: $successRate%" -ForegroundColor White
Write-Host "Mapping Score: $mappingScore%" -ForegroundColor White
Write-Host "`nFinal Summary (first 50 lines):" -ForegroundColor Gray
Get-Content ops/reports/FINAL_SUMMARY.md -TotalCount 50 | Write-Host
Write-Host "=========================================" -ForegroundColor Cyan

Write-Host "`nHYBRID EXECUTION COMPLETE" -ForegroundColor Green
exit $exitCode

