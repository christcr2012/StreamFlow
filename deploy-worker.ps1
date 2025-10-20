# Cortiware Worker Deployment Script for Fly.io
# Run this script to deploy the worker service

Write-Host "🚀 Cortiware Worker Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if flyctl is installed
Write-Host "Checking for Fly CLI..." -ForegroundColor Yellow
$flyctlInstalled = Get-Command flyctl -ErrorAction SilentlyContinue

if (-not $flyctlInstalled) {
    Write-Host "❌ Fly CLI not found. Installing..." -ForegroundColor Red
    Write-Host ""
    Write-Host "Installing Fly CLI (requires admin privileges)..." -ForegroundColor Yellow
    
    try {
        iwr https://fly.io/install.ps1 -useb | iex
        Write-Host "✅ Fly CLI installed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Failed to install Fly CLI automatically." -ForegroundColor Red
        Write-Host "Please install manually from: https://fly.io/docs/hands-on/install-flyctl/" -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ Fly CLI found: $(flyctl version)" -ForegroundColor Green
}

Write-Host ""

# Check if logged in
Write-Host "Checking Fly.io authentication..." -ForegroundColor Yellow
$authCheck = flyctl auth whoami 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Fly.io" -ForegroundColor Red
    Write-Host "Opening browser for login..." -ForegroundColor Yellow
    flyctl auth login
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Login failed. Please try again." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ Logged in as: $authCheck" -ForegroundColor Green
}

Write-Host ""

# Navigate to worker directory
Write-Host "Navigating to worker directory..." -ForegroundColor Yellow
Set-Location services/worker

if (-not (Test-Path "fly.toml")) {
    Write-Host "❌ fly.toml not found. Are you in the correct directory?" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Found fly.toml" -ForegroundColor Green
Write-Host ""

# Prompt for environment variables
Write-Host "📝 Environment Variables Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "You'll need these values from Vercel:" -ForegroundColor Yellow
Write-Host "1. REDIS_URL (from KV_REDIS_URL or REDIS_URL)" -ForegroundColor Yellow
Write-Host "2. DATABASE_URL (Neon PostgreSQL connection)" -ForegroundColor Yellow
Write-Host "3. STRIPE_SECRET_KEY (optional, if using Stripe)" -ForegroundColor Yellow
Write-Host "4. STRIPE_WEBHOOK_SECRET (optional, if using Stripe)" -ForegroundColor Yellow
Write-Host ""

$redisUrl = Read-Host "Enter REDIS_URL (rediss://...)"
$databaseUrl = Read-Host "Enter DATABASE_URL (postgresql://...)"
$stripeKey = Read-Host "Enter STRIPE_SECRET_KEY (or press Enter to skip)"
$stripeWebhook = Read-Host "Enter STRIPE_WEBHOOK_SECRET (or press Enter to skip)"

Write-Host ""

# Deploy
Write-Host "🚀 Deploying to Fly.io..." -ForegroundColor Cyan
Write-Host ""

# Check if app exists
$appExists = flyctl apps list 2>&1 | Select-String "cortiware-worker"

if (-not $appExists) {
    Write-Host "Creating new app..." -ForegroundColor Yellow
    flyctl launch --now --name cortiware-worker --region iad --no-deploy
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to create app" -ForegroundColor Red
        exit 1
    }
}

# Set secrets
Write-Host "Setting environment variables..." -ForegroundColor Yellow

$secretsCmd = "flyctl secrets set REDIS_URL=`"$redisUrl`" DATABASE_URL=`"$databaseUrl`" WORKER_CONCURRENCY=`"8`" WORKER_MAX_RETRIES=`"5`" WORKER_BACKOFF_MS=`"15000`""

if ($stripeKey) {
    $secretsCmd += " STRIPE_SECRET_KEY=`"$stripeKey`""
}

if ($stripeWebhook) {
    $secretsCmd += " STRIPE_WEBHOOK_SECRET=`"$stripeWebhook`""
}

Invoke-Expression $secretsCmd

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set secrets" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Secrets configured" -ForegroundColor Green
Write-Host ""

# Configure auto-scaling
Write-Host "Configuring auto-scaling (min=0, max=2)..." -ForegroundColor Yellow
flyctl autoscale set min=0 max=2

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Warning: Failed to set auto-scaling" -ForegroundColor Yellow
} else {
    Write-Host "✅ Auto-scaling configured" -ForegroundColor Green
}

Write-Host ""

# Deploy
Write-Host "Deploying worker..." -ForegroundColor Yellow
flyctl deploy

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Deployment failed" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host ""

# Test health endpoint
Write-Host "Testing health endpoint..." -ForegroundColor Yellow
$appName = (Get-Content fly.toml | Select-String 'app = "(.+)"').Matches.Groups[1].Value
$healthUrl = "https://$appName.fly.dev/health"

try {
    $response = Invoke-RestMethod -Uri $healthUrl -Method Get
    Write-Host "✅ Health check passed: $($response | ConvertTo-Json)" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Health check failed (worker may still be starting)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Worker deployed successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. View logs: flyctl logs" -ForegroundColor White
Write-Host "2. Check status: flyctl status" -ForegroundColor White
Write-Host "3. Open dashboard: flyctl dashboard" -ForegroundColor White
Write-Host "4. Test with Stripe webhook or enqueue a test job" -ForegroundColor White
Write-Host ""
Write-Host "Worker URL: $healthUrl" -ForegroundColor Yellow
Write-Host ""

