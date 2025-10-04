# ============================================================================
# StreamFlow - Reduce API Files for Build
# Temporarily moves generated API files to allow build to complete
# ============================================================================

Write-Host "🔧 StreamFlow - API File Reduction for Build" -ForegroundColor Green
Write-Host ""

$apiDir = "src/pages/api"
$backupDir = "ops/api-backup"
$keepPattern = "endpoint[0-9]{1,3}\.ts$" # Keep only endpoint0.ts to endpoint999.ts (1000 files)

# ============================================================================
# STEP 1: Create Backup Directory
# ============================================================================
Write-Host "📁 Step 1: Creating backup directory..." -ForegroundColor Cyan

if (!(Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
    Write-Host "   ✅ Created $backupDir" -ForegroundColor Green
} else {
    Write-Host "   ✅ Backup directory exists" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 2: Count API Files
# ============================================================================
Write-Host "📊 Step 2: Counting API files..." -ForegroundColor Cyan

$allApiFiles = Get-ChildItem -Path $apiDir -Filter "endpoint*.ts" -Recurse
$totalFiles = $allApiFiles.Count

Write-Host "   📈 Total API files: $totalFiles" -ForegroundColor Yellow
Write-Host ""

if ($totalFiles -lt 5000) {
    Write-Host "   ✅ File count is manageable, no reduction needed" -ForegroundColor Green
    Write-Host "   💡 Try running: npm run build" -ForegroundColor Cyan
    exit 0
}

# ============================================================================
# STEP 3: Move Excess Files to Backup
# ============================================================================
Write-Host "🚚 Step 3: Moving excess API files to backup..." -ForegroundColor Cyan
Write-Host "   ⏱️  This may take a few minutes..." -ForegroundColor Yellow
Write-Host ""

$movedCount = 0
$keptCount = 0

foreach ($file in $allApiFiles) {
    # Extract endpoint number
    if ($file.Name -match "endpoint(\d+)\.ts") {
        $endpointNum = [int]$matches[1]
        
        # Keep files with endpoint number < 1000
        if ($endpointNum -lt 1000) {
            $keptCount++
            if ($keptCount % 100 -eq 0) {
                Write-Host "   ✅ Kept $keptCount files..." -ForegroundColor Green
            }
        } else {
            # Move to backup
            $relativePath = $file.FullName.Substring($apiDir.Length + 1)
            $backupPath = Join-Path $backupDir $relativePath
            $backupParent = Split-Path $backupPath -Parent
            
            if (!(Test-Path $backupParent)) {
                New-Item -ItemType Directory -Path $backupParent -Force | Out-Null
            }
            
            Move-Item -Path $file.FullName -Destination $backupPath -Force
            $movedCount++
            
            if ($movedCount % 1000 -eq 0) {
                Write-Host "   📦 Moved $movedCount files..." -ForegroundColor Cyan
            }
        }
    }
}

Write-Host ""
Write-Host "   ✅ Kept $keptCount API files" -ForegroundColor Green
Write-Host "   📦 Moved $movedCount API files to backup" -ForegroundColor Cyan
Write-Host ""

# ============================================================================
# STEP 4: Create Restore Script
# ============================================================================
Write-Host "📝 Step 4: Creating restore script..." -ForegroundColor Cyan

$restoreScript = @"
# ============================================================================
# StreamFlow - Restore API Files
# Restores API files from backup after successful build
# ============================================================================

Write-Host "🔄 Restoring API files from backup..." -ForegroundColor Green
Write-Host ""

`$backupDir = "ops/api-backup"
`$apiDir = "src/pages/api"

if (!(Test-Path `$backupDir)) {
    Write-Host "   ❌ Backup directory not found" -ForegroundColor Red
    exit 1
}

`$backupFiles = Get-ChildItem -Path `$backupDir -Filter "*.ts" -Recurse
`$totalFiles = `$backupFiles.Count

Write-Host "   📊 Found `$totalFiles files to restore" -ForegroundColor Cyan
Write-Host ""

`$restoredCount = 0

foreach (`$file in `$backupFiles) {
    `$relativePath = `$file.FullName.Substring(`$backupDir.Length + 1)
    `$targetPath = Join-Path `$apiDir `$relativePath
    `$targetParent = Split-Path `$targetPath -Parent
    
    if (!(Test-Path `$targetParent)) {
        New-Item -ItemType Directory -Path `$targetParent -Force | Out-Null
    }
    
    Move-Item -Path `$file.FullName -Destination `$targetPath -Force
    `$restoredCount++
    
    if (`$restoredCount % 1000 -eq 0) {
        Write-Host "   ✅ Restored `$restoredCount files..." -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "   ✅ Restored `$restoredCount API files" -ForegroundColor Green
Write-Host ""

# Clean up backup directory
Remove-Item -Recurse -Force `$backupDir -ErrorAction SilentlyContinue
Write-Host "   ✅ Cleaned up backup directory" -ForegroundColor Green
Write-Host ""
Write-Host "🎉 Restore complete!" -ForegroundColor Green
"@

$restoreScript | Out-File "scripts/restore-api-files.ps1" -Encoding UTF8
Write-Host "   ✅ Created scripts/restore-api-files.ps1" -ForegroundColor Green
Write-Host ""

# ============================================================================
# SUCCESS SUMMARY
# ============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    ✅ API FILES REDUCED                        " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Summary:" -ForegroundColor Cyan
Write-Host "   Original files:  $totalFiles" -ForegroundColor White
Write-Host "   Kept files:      $keptCount" -ForegroundColor White
Write-Host "   Moved to backup: $movedCount" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Run build:     npm run build" -ForegroundColor White
Write-Host "   2. After success: .\scripts\restore-api-files.ps1" -ForegroundColor White
Write-Host ""
Write-Host "Note: The moved files are safely backed up in ops/api-backup" -ForegroundColor Yellow
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

exit 0

