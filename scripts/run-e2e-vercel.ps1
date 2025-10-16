# PowerShell script to run E2E tests against Vercel deployments

Write-Host "Running E2E Tests Against Vercel" -ForegroundColor Cyan

# Set environment variables
$env:TENANT_APP_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:PROVIDER_PORTAL_URL = "https://stream-flow-git-main-christcr2012s-projects.vercel.app"
$env:CI = "true"
$env:TEST_OWNER_EMAIL = "owner@test.com"
$env:TEST_OWNER_PASSWORD = "password123"
$env:TEST_PROVIDER_EMAIL = "provider@test.com"
$env:TEST_PROVIDER_PASSWORD = "password123"

Write-Host "Testing: $env:TENANT_APP_URL" -ForegroundColor Yellow

# Run tests
npm run test:e2e:playwright

exit $LASTEXITCODE

