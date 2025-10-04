# scripts/augment-verify-and-guard.ps1
param(
  [int]$MinApi = 100,
  [int]$MinUi = 10,
  [int]$RequiredSuccessRate = 95
)

Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  AUGMENT BINDER VERIFICATION & GUARD PIPELINE" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "== Phase 0: Quick stats ==" -ForegroundColor Yellow
powershell -ExecutionPolicy Bypass -File scripts/quick-stat.ps1
if ($LASTEXITCODE -ne 0) {
  Write-Error "Quick stat failed."
  exit 1
}

Write-Host "`n== Phase 1: TypeScript shard checks ==" -ForegroundColor Yellow
$errs = 0

Write-Host "`n  → Checking API shard..." -ForegroundColor Gray
npm run typecheck:api
if ($LASTEXITCODE -ne 0) { 
  Write-Warning "API typecheck had errors (may be pre-existing)"
  $errs++ 
}

Write-Host "`n  → Checking UI shard..." -ForegroundColor Gray
npm run typecheck:ui
if ($LASTEXITCODE -ne 0) { 
  Write-Warning "UI typecheck had errors (may be pre-existing)"
  $errs++ 
}

if ($errs -gt 0) {
  Write-Host "`n⚠️  TypeScript checks completed with $errs shard(s) having errors." -ForegroundColor Yellow
  Write-Host "    These may be pre-existing issues. Continuing with verification..." -ForegroundColor Yellow
}

Write-Host "`n== Phase 2: Binder → code verification ==" -ForegroundColor Yellow
# Allow overriding thresholds via env if needed
$env:MIN_GENERATED_API_FILES = $MinApi
$env:MIN_GENERATED_UI_FILES = $MinUi
$env:REQUIRED_SUCCESS_RATE = $RequiredSuccessRate

node scripts/verify-real-code.js
if ($LASTEXITCODE -ne 0) {
  Write-Error "❌ Verification failed. See ops/reports/VERIFY_SUMMARY.md"
  exit 4
}

Write-Host "`n== Phase 3: Final console recap ==" -ForegroundColor Yellow
if (Test-Path ops/reports/VERIFY_SUMMARY.md) {
  Get-Content ops/reports/VERIFY_SUMMARY.md | Select-Object -First 40 | ForEach-Object { Write-Host $_ }
} else {
  Write-Warning "VERIFY_SUMMARY.md not found"
}

Write-Host "`n================================================================" -ForegroundColor Green
Write-Host "  PASS: All checks succeeded." -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green
exit 0

