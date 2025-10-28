param(
  [string]$AppPath = "apps/provider-portal"
)

# Build provider-portal with DATABASE_URL sourced from repo .env/.env.local
$ErrorActionPreference = 'Stop'

function Get-EnvValue([string]$filePath, [string]$key) {
  if (-not (Test-Path $filePath)) { return $null }
  $lines = Get-Content -LiteralPath $filePath
  foreach ($line in $lines) {
    if ($line -match "^\s*${key}\s*=\s*(.*)\s*$") {
      $val = $Matches[1]
      if ($val.StartsWith('"') -and $val.EndsWith('"')) { $val = $val.Substring(1, $val.Length-2) }
      if ($val.StartsWith("'") -and $val.EndsWith("'")) { $val = $val.Substring(1, $val.Length-2) }
      return $val.Trim()
    }
  }
  return $null
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot '..') | Select-Object -ExpandProperty Path
$envFile = Join-Path $repoRoot '.env'
$envLocalFile = Join-Path $repoRoot '.env.local'

$dbUrl = Get-EnvValue $envFile 'DATABASE_URL'
if (-not $dbUrl) { $dbUrl = Get-EnvValue $envLocalFile 'DATABASE_URL' }
if (-not $dbUrl) {
  Write-Error 'DATABASE_URL not found in .env or .env.local at repo root.'
}

Write-Host "Using DATABASE_URL from repo env files (hidden)." -ForegroundColor Cyan

Push-Location $repoRoot
try {
  Push-Location $AppPath
  $env:DATABASE_URL = $dbUrl
  npm run -s build
}
finally {
  Pop-Location
  Pop-Location
}
