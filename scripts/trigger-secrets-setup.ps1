#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Triggers the GitHub Actions workflow to set repository secrets
.DESCRIPTION
    Reads secrets from mcp-config.json and triggers the setup-secrets workflow
#>

$ErrorActionPreference = "Stop"

Write-Host "🔐 Reading secrets from mcp-config.json..." -ForegroundColor Cyan

$configPath = Join-Path $PSScriptRoot ".." "mcp-config.json"
if (-not (Test-Path $configPath)) {
    Write-Host "❌ mcp-config.json not found at: $configPath" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configPath | ConvertFrom-Json

# Extract values
$vercelToken = $config.mcpServers.'vercel-robinsonai'.args[1]
$neonApiKey = $config.mcpServers.'neon-robinsonai'.args[2]
$githubPat = $config.mcpServers.'github-robinsonai'.env.GITHUB_PERSONAL_ACCESS_TOKEN
$redisUrl = $config.mcpServers.'redis-robinsonai'.args[1]
$resendKey = $config.mcpServers.'resend-cortiware'.env.RESEND_API_KEY
$twilioSid = $config.mcpServers.'twilio-cortiware'.env.TWILIO_ACCOUNT_SID
$twilioToken = $config.mcpServers.'twilio-cortiware'.env.TWILIO_AUTH_TOKEN
$cloudflareToken = $config.mcpServers.'cloudflare-cortiware'.env.CLOUDFLARE_API_TOKEN

Write-Host "✓ Secrets extracted from config" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Triggering GitHub Actions workflow..." -ForegroundColor Cyan

# Trigger the workflow with inputs
gh workflow run setup-secrets.yml `
    -f vercel_token="$vercelToken" `
    -f vercel_org_id="team_PUafLQmqT7LYBaBs8lEOPYMG" `
    -f neon_api_key="$neonApiKey" `
    -f neon_project_id="ep-billowing-truth-afi1gfga" `
    -f github_pat="$githubPat" `
    -f redis_url="$redisUrl" `
    -f resend_key="$resendKey" `
    -f twilio_sid="$twilioSid" `
    -f twilio_token="$twilioToken" `
    -f cloudflare_token="$cloudflareToken"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Workflow triggered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Check the workflow status:" -ForegroundColor Yellow
    Write-Host "   gh run list --workflow=setup-secrets.yml" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   Or visit: https://github.com/christcr2012/Cortiware/actions" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "❌ Failed to trigger workflow" -ForegroundColor Red
    exit 1
}
