# ============================================================================
# Binder Pruning - Apply Safe Removals
# Removes 99.8% of unused API endpoints and 99.9% of unused UI files
# ============================================================================

Write-Host "🗑️  BINDER PRUNING - APPLYING SAFE REMOVALS" -ForegroundColor Green
Write-Host ""

$ROOT = "C:\Users\chris\Git Local\StreamFlow"
$REPORTS_DIR = "$ROOT\ops\reports"
$BACKUP_DIR = "$ROOT\ops\pruned-backup"

# Load classification
$classificationPath = "$REPORTS_DIR\classification.json"
if (!(Test-Path $classificationPath)) {
    Write-Host "❌ Error: classification.json not found" -ForegroundColor Red
    exit 1
}

$classification = Get-Content $classificationPath | ConvertFrom-Json

Write-Host "📊 Classification Summary:" -ForegroundColor Cyan
Write-Host "   Required APIs: $($classification.stats.required_apis) (0.2 percent)" -ForegroundColor Green
Write-Host "   Candidate APIs: $($classification.stats.candidate_apis) (99.8 percent)" -ForegroundColor Yellow
Write-Host "   Required UI: $($classification.stats.required_ui) (0.1 percent)" -ForegroundColor Green
Write-Host "   Candidate UI: $($classification.stats.candidate_ui) (99.9 percent)" -ForegroundColor Yellow
Write-Host ""

# Confirm with user
Write-Host "⚠️  WARNING: This will delete $($classification.stats.candidate_apis + $classification.stats.candidate_ui) files!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Files will be backed up to: $BACKUP_DIR" -ForegroundColor Cyan
Write-Host ""
$confirm = Read-Host "Continue? (yes/no)"

if ($confirm -ne "yes") {
    Write-Host "❌ Aborted by user" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "🚀 Starting pruning process..." -ForegroundColor Green
Write-Host ""

# Create backup directory
if (!(Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR -Force | Out-Null
}

# Phase 1: Backup and remove candidate APIs
Write-Host "📦 Phase 1: Removing candidate API files..." -ForegroundColor Cyan
$removedApis = 0
$failedApis = 0

foreach ($api in $classification.candidate_apis) {
    $filePath = Join-Path $ROOT $api.file
    
    if (Test-Path $filePath) {
        try {
            # Create backup
            $relativePath = $api.file
            $backupPath = Join-Path $BACKUP_DIR "apis\$relativePath"
            $backupDir = Split-Path $backupPath -Parent
            
            if (!(Test-Path $backupDir)) {
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            }
            
            Copy-Item -Path $filePath -Destination $backupPath -Force
            
            # Remove file
            Remove-Item -Path $filePath -Force
            $removedApis++
            
            if ($removedApis % 1000 -eq 0) {
                Write-Host "   Removed $removedApis APIs..." -ForegroundColor Green
            }
        } catch {
            $failedApis++
            Write-Host "   ⚠️  Failed to remove: $($api.file)" -ForegroundColor Yellow
        }
    }
}

Write-Host "   ✅ Removed $removedApis API files" -ForegroundColor Green
if ($failedApis -gt 0) {
    Write-Host "   ⚠️  Failed: $failedApis files" -ForegroundColor Yellow
}
Write-Host ""

# Phase 2: Backup and remove candidate UI files
Write-Host "📦 Phase 2: Removing candidate UI files..." -ForegroundColor Cyan
$removedUi = 0
$failedUi = 0

foreach ($ui in $classification.candidate_ui) {
    $filePath = Join-Path $ROOT $ui.file
    
    if (Test-Path $filePath) {
        try {
            # Create backup
            $relativePath = $ui.file
            $backupPath = Join-Path $BACKUP_DIR "ui\$relativePath"
            $backupDir = Split-Path $backupPath -Parent
            
            if (!(Test-Path $backupDir)) {
                New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
            }
            
            Copy-Item -Path $filePath -Destination $backupPath -Force
            
            # Remove file
            Remove-Item -Path $filePath -Force
            $removedUi++
            
            if ($removedUi % 1000 -eq 0) {
                Write-Host "   Removed $removedUi UI files..." -ForegroundColor Green
            }
        } catch {
            $failedUi++
            Write-Host "   ⚠️  Failed to remove: $($ui.file)" -ForegroundColor Yellow
        }
    }
}

Write-Host "   ✅ Removed $removedUi UI files" -ForegroundColor Green
if ($failedUi -gt 0) {
    Write-Host "   ⚠️  Failed: $failedUi files" -ForegroundColor Yellow
}
Write-Host ""

# Phase 3: Clean empty directories
Write-Host "🧹 Phase 3: Cleaning empty directories..." -ForegroundColor Cyan
$cleanedDirs = 0

function Remove-EmptyDirectories {
    param([string]$Path)
    
    Get-ChildItem -Path $Path -Directory -Recurse | Sort-Object -Property FullName -Descending | ForEach-Object {
        if ((Get-ChildItem -Path $_.FullName -File -Recurse).Count -eq 0) {
            Remove-Item -Path $_.FullName -Force -Recurse -ErrorAction SilentlyContinue
            $script:cleanedDirs++
        }
    }
}

Remove-EmptyDirectories -Path "$ROOT\src\pages\api"
Remove-EmptyDirectories -Path "$ROOT\src\pages"
Remove-EmptyDirectories -Path "$ROOT\src\components"

Write-Host "   ✅ Cleaned $cleanedDirs empty directories" -ForegroundColor Green
Write-Host ""

# Phase 4: Generate post-prune inventory
Write-Host "📊 Phase 4: Generating post-prune inventory..." -ForegroundColor Cyan

$postInventory = @{
    timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss")
    counts = @{
        api_files = (Get-ChildItem -Path "$ROOT\src\pages\api" -Filter "*.ts" -Recurse -File -ErrorAction SilentlyContinue).Count
        ui_files = (Get-ChildItem -Path "$ROOT\src\app" -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue).Count + 
                   (Get-ChildItem -Path "$ROOT\src\pages" -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue).Count
        component_files = (Get-ChildItem -Path "$ROOT\src\components" -Filter "*.tsx" -Recurse -File -ErrorAction SilentlyContinue).Count
    }
    removed = @{
        apis = $removedApis
        ui = $removedUi
        total = $removedApis + $removedUi
    }
    failed = @{
        apis = $failedApis
        ui = $failedUi
        total = $failedApis + $failedUi
    }
}

$postInventory | ConvertTo-Json -Depth 10 | Out-File "$REPORTS_DIR\post_prune_inventory.json" -Encoding UTF8

Write-Host "   ✅ Post-prune inventory saved" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    ✅ PRUNING COMPLETE                         " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   APIs removed: $removedApis" -ForegroundColor White
Write-Host "   UI files removed: $removedUi" -ForegroundColor White
Write-Host "   Total removed: $($removedApis + $removedUi)" -ForegroundColor White
Write-Host "   Empty dirs cleaned: $cleanedDirs" -ForegroundColor White
Write-Host ""
Write-Host "Current counts:" -ForegroundColor Cyan
Write-Host "   API files: $($postInventory.counts.api_files)" -ForegroundColor White
Write-Host "   UI files: $($postInventory.counts.ui_files)" -ForegroundColor White
Write-Host "   Components: $($postInventory.counts.component_files)" -ForegroundColor White
Write-Host ""
Write-Host "Backup location: $BACKUP_DIR" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "   1. Run typecheck: npm run typecheck" -ForegroundColor White
Write-Host "   2. Run build: npm run build" -ForegroundColor White
Write-Host "   3. Generate final report: node scripts/binder-minify-report.js" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

