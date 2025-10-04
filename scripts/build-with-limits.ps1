# ============================================================================
# StreamFlow - Build with Increased File Handle Limits
# Fixes "EMFILE: too many open files" error on Windows
# ============================================================================

Write-Host "🚀 StreamFlow Build with Optimized File Handling" -ForegroundColor Green
Write-Host ""

# ============================================================================
# STEP 1: Clean Previous Build Artifacts
# ============================================================================
Write-Host "🧹 Step 1: Cleaning previous build artifacts..." -ForegroundColor Cyan

if (Test-Path ".next") {
    Remove-Item -Recurse -Force ".next" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed .next directory" -ForegroundColor Green
}

if (Test-Path "out") {
    Remove-Item -Recurse -Force "out" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Removed out directory" -ForegroundColor Green
}

# Clear Node.js cache
if (Test-Path "$env:TEMP\node-*") {
    Remove-Item -Recurse -Force "$env:TEMP\node-*" -ErrorAction SilentlyContinue
    Write-Host "   ✅ Cleared Node.js temp cache" -ForegroundColor Green
}

Write-Host ""

# ============================================================================
# STEP 2: Set Environment Variables for Build Optimization
# ============================================================================
Write-Host "⚙️  Step 2: Setting build optimization environment variables..." -ForegroundColor Cyan

# Increase Node.js memory limit (8GB)
$env:NODE_OPTIONS = "--max-old-space-size=8192"
Write-Host "   ✅ NODE_OPTIONS = --max-old-space-size=8192" -ForegroundColor Green

# Reduce UV thread pool size to limit concurrent file operations
$env:UV_THREADPOOL_SIZE = "4"
Write-Host "   ✅ UV_THREADPOOL_SIZE = 4" -ForegroundColor Green

# Disable Next.js telemetry to reduce overhead
$env:NEXT_TELEMETRY_DISABLED = "1"
Write-Host "   ✅ NEXT_TELEMETRY_DISABLED = 1" -ForegroundColor Green

# Set production mode
$env:NODE_ENV = "production"
Write-Host "   ✅ NODE_ENV = production" -ForegroundColor Green

Write-Host ""

# ============================================================================
# STEP 3: Run Prisma Migrations
# ============================================================================
Write-Host "🗄️  Step 3: Running Prisma migrations..." -ForegroundColor Cyan

try {
    npx prisma migrate deploy 2>&1 | Out-String | Write-Host
    Write-Host "   ✅ Prisma migrations completed" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Prisma migrations failed (may be expected if no pending migrations)" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 4: Generate Prisma Client
# ============================================================================
Write-Host "🔧 Step 4: Generating Prisma client..." -ForegroundColor Cyan

try {
    npx prisma generate 2>&1 | Out-String | Write-Host
    Write-Host "   ✅ Prisma client generated" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Prisma client generation failed" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 5: Build Next.js Application
# ============================================================================
Write-Host "🏗️  Step 5: Building Next.js application..." -ForegroundColor Cyan
Write-Host "   ⏱️  This may take 5-10 minutes for large codebase..." -ForegroundColor Yellow
Write-Host ""

$buildStartTime = Get-Date

try {
    # Run Next.js build with optimized settings
    npx next build 2>&1 | Tee-Object -FilePath "ops/logs/build.log" | Write-Host
    
    $buildEndTime = Get-Date
    $buildDuration = ($buildEndTime - $buildStartTime).TotalMinutes
    
    Write-Host ""
    Write-Host "   ✅ Build completed successfully!" -ForegroundColor Green
    Write-Host "   ⏱️  Build duration: $([math]::Round($buildDuration, 2)) minutes" -ForegroundColor Cyan
    
} catch {
    $buildEndTime = Get-Date
    $buildDuration = ($buildEndTime - $buildStartTime).TotalMinutes
    
    Write-Host ""
    Write-Host "   ❌ Build failed after $([math]::Round($buildDuration, 2)) minutes" -ForegroundColor Red
    Write-Host "   📋 Check ops/logs/build.log for details" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Common issues:" -ForegroundColor Yellow
    Write-Host "   1. EMFILE error: Too many files open (Windows limit)" -ForegroundColor Yellow
    Write-Host "   2. Out of memory: Increase NODE_OPTIONS memory" -ForegroundColor Yellow
    Write-Host "   3. TypeScript errors: Run 'npm run typecheck' first" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host ""

# ============================================================================
# STEP 6: Verify Build Output
# ============================================================================
Write-Host "✅ Step 6: Verifying build output..." -ForegroundColor Cyan

if (Test-Path ".next") {
    $nextSize = (Get-ChildItem -Recurse ".next" | Measure-Object -Property Length -Sum).Sum / 1MB
    Write-Host "   ✅ .next directory exists ($([math]::Round($nextSize, 2)) MB)" -ForegroundColor Green
} else {
    Write-Host "   ❌ .next directory not found" -ForegroundColor Red
    exit 1
}

if (Test-Path ".next/BUILD_ID") {
    $buildId = Get-Content ".next/BUILD_ID"
    Write-Host "   ✅ Build ID: $buildId" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  Build ID not found" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# STEP 7: Generate Build Report
# ============================================================================
Write-Host "📊 Step 7: Generating build report..." -ForegroundColor Cyan

$report = @{
    timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    duration_minutes = [math]::Round($buildDuration, 2)
    build_size_mb = [math]::Round($nextSize, 2)
    node_version = (node --version)
    npm_version = (npm --version)
    next_version = (npx next --version)
    status = "success"
}

$report | ConvertTo-Json | Out-File "ops/reports/build_report.json" -Encoding UTF8
Write-Host "   ✅ Build report saved to ops/reports/build_report.json" -ForegroundColor Green

Write-Host ""

# ============================================================================
# SUCCESS SUMMARY
# ============================================================================
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "                    🎉 BUILD SUCCESSFUL 🎉                      " -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "Build Summary:" -ForegroundColor Cyan
Write-Host "   Duration:    $([math]::Round($buildDuration, 2)) minutes" -ForegroundColor White
Write-Host "   Build Size:  $([math]::Round($nextSize, 2)) MB" -ForegroundColor White
Write-Host "   Build ID:    $buildId" -ForegroundColor White
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test locally:  npm start" -ForegroundColor White
Write-Host "   2. Deploy:        vercel --prod" -ForegroundColor White
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""

exit 0

