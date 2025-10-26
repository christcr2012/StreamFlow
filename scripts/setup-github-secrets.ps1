# GitHub Secrets Setup Script
# This script adds required secrets to your GitHub repository
# Run with: .\scripts\setup-github-secrets.ps1

Write-Host "🔐 Setting up GitHub Secrets for Cortiware..." -ForegroundColor Cyan
Write-Host ""

# Check if gh CLI is installed
if (!(Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI (gh) is not installed!" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

# Check if authenticated
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Not authenticated with GitHub CLI" -ForegroundColor Red
    Write-Host "Run: gh auth login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI authenticated" -ForegroundColor Green
Write-Host ""

# Repository
$repo = "christcr2012/Cortiware"

# Load secrets from mcp-config-working.json
$mcpConfigPath = Join-Path $PSScriptRoot "..\mcp-config-working.json"
if (Test-Path $mcpConfigPath) {
    $mcpConfig = Get-Content $mcpConfigPath | ConvertFrom-Json
    
    # Extract VERCEL_TOKEN from vercel-mcp args
    $vercelToken = $mcpConfig.mcpServers.'vercel-robinsonai'.args[1]
    
    # Extract NEON API key from neon-mcp args (the napi_xxx token)
    $neonApiKey = $mcpConfig.mcpServers.'neon-robinsonai'.args[3]
    
    Write-Host "📋 Found secrets in mcp-config-working.json" -ForegroundColor Green
}

# Secrets to add
$secrets = @{
    "VERCEL_TOKEN" = $vercelToken
    "VERCEL_ORG_ID" = "team_PUafLQmqT7LYBaBs8lEOPYMG"  # From documentation
    "NEON_API_KEY" = $neonApiKey
    "NEON_PROJECT_ID" = "ep-billowing-truth-afi1gfga"  # From connection string in docs
}

Write-Host "🔑 Adding secrets to GitHub repository: $repo" -ForegroundColor Cyan
Write-Host ""

foreach ($secretName in $secrets.Keys) {
    $secretValue = $secrets[$secretName]
    
    if ([string]::IsNullOrWhiteSpace($secretValue)) {
        Write-Host "⚠️  Skipping $secretName (no value found)" -ForegroundColor Yellow
        continue
    }
    
    Write-Host "Adding: $secretName" -ForegroundColor White
    
    # Add secret using gh CLI
    $secretValue | gh secret set $secretName --repo $repo
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ $secretName added successfully" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Failed to add $secretName" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "✨ Secret setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To verify secrets were added:" -ForegroundColor Cyan
Write-Host "  gh secret list --repo $repo" -ForegroundColor White
Write-Host ""
Write-Host "Note: GITLEAKS_LICENSE is optional (for Gitleaks Pro)" -ForegroundColor Yellow
Write-Host "If you need it, add manually with:" -ForegroundColor Yellow
Write-Host "  gh secret set GITLEAKS_LICENSE --repo $repo" -ForegroundColor White
