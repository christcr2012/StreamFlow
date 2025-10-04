# scripts/quick-stat.ps1
param()
Write-Host "=== QUICK STAT ==="
$api = Get-ChildItem -Recurse -Path src/pages/api -Include *.ts,*.tsx -ErrorAction SilentlyContinue
$ui = Get-ChildItem -Recurse -Path src/app,src/components -Include *.tsx -ErrorAction SilentlyContinue
Write-Host "API files: $($api.Count)"
Write-Host "UI files: $($ui.Count)"
Write-Host "Generated headers in API (sample):"
Select-String -Path src/pages/api/**/*.ts -Pattern "AUTO-GENERATED|binder|generated from" -List -ErrorAction SilentlyContinue | Select-Object -First 10 | ForEach-Object { Write-Host "  $($_.Path)" }

