# Module: Stripe CLI Development Script (Windows)
# Purpose: Forward Stripe webhooks to local development server
# Scope: Local development only
# Notes: Codex Phase 8.7 - Stripe CLI webhook forwarding (PowerShell)

Write-Host "🔧 Starting Stripe CLI webhook forwarding..." -ForegroundColor Cyan
Write-Host ""

# Check if Stripe CLI is installed
$stripePath = Get-Command stripe -ErrorAction SilentlyContinue

if (-not $stripePath) {
    Write-Host "❌ Stripe CLI not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Install it with:" -ForegroundColor Yellow
    Write-Host "  scoop install stripe" -ForegroundColor White
    Write-Host "  or download from: https://stripe.com/docs/stripe-cli#install" -ForegroundColor White
    Write-Host ""
    exit 1
}

# Check if logged in
$configTest = stripe config --list 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not logged in to Stripe CLI" -ForegroundColor Red
    Write-Host ""
    Write-Host "Run: stripe login" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

Write-Host "✅ Stripe CLI found and authenticated" -ForegroundColor Green
Write-Host ""

# Forward webhooks to local server
Write-Host "📡 Forwarding webhooks to http://localhost:3000/api/webhooks/stripe-connect" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  IMPORTANT: Copy the webhook signing secret below and add it to your .env.local:" -ForegroundColor Yellow
Write-Host "   STRIPE_CONNECT_WEBHOOK_SECRET=whsec_..." -ForegroundColor White
Write-Host ""

stripe listen `
  --forward-to localhost:3000/api/webhooks/stripe-connect `
  --events account.updated,payment_intent.succeeded,payment_intent.payment_failed,charge.succeeded,charge.failed,payout.paid,payout.failed

# PR-CHECKS:
# - [x] Stripe CLI dev script created (Windows)
# - [x] Checks for Stripe CLI installation
# - [x] Checks for authentication
# - [x] Forwards Connect events to local webhook endpoint
# - [x] Instructions for webhook secret

