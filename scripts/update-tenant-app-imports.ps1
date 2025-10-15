# Update tenant-app imports from local components to @cortiware/ui

$files = @(
    "apps\tenant-app\src\app\agreements\page.tsx",
    "apps\tenant-app\src\app\customers\customers-client.tsx",
    "apps\tenant-app\src\app\customers\loading.tsx",
    "apps\tenant-app\src\app\customers\new\new-customer-client.tsx",
    "apps\tenant-app\src\app\customers\[id]\customer-detail-client.tsx",
    "apps\tenant-app\src\app\customers\[id]\loading.tsx",
    "apps\tenant-app\src\app\dashboard\dashboard-client.tsx",
    "apps\tenant-app\src\app\invoices\loading.tsx",
    "apps\tenant-app\src\app\invoices\page.tsx",
    "apps\tenant-app\src\app\invoices\new\new-invoice-client.tsx",
    "apps\tenant-app\src\app\invoices\recurring\recurring-invoices-client.tsx",
    "apps\tenant-app\src\app\invoices\[id]\invoice-detail-client.tsx",
    "apps\tenant-app\src\app\invoices\[id]\loading.tsx",
    "apps\tenant-app\src\app\jobs\jobs-client.tsx",
    "apps\tenant-app\src\app\jobs\loading.tsx",
    "apps\tenant-app\src\app\jobs\new\new-job-client.tsx",
    "apps\tenant-app\src\app\jobs\[id]\job-detail-client.tsx",
    "apps\tenant-app\src\app\jobs\[id]\loading.tsx",
    "apps\tenant-app\src\app\settings\page.tsx",
    "apps\tenant-app\src\app\settings\integrations\integrations-client.tsx",
    "apps\tenant-app\src\app\settings\theme\theme-settings-client.tsx",
    "apps\tenant-app\src\app\wallet\page.tsx",
    "apps\tenant-app\src\components\empty-state.tsx",
    "apps\tenant-app\src\components\error-boundary.tsx",
    "apps\tenant-app\src\components\job-photo-gallery.tsx",
    "apps\tenant-app\src\components\ui\pagination.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw

        # Replace imports
        $content = $content -replace 'from [''"]@/components/ui/button[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]@/components/ui/card[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]@/components/ui/input[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]@/components/ui/modal[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]@/components/ui/skeleton[''"]', "from '@cortiware/ui'"

        # Replace relative imports
        $content = $content -replace 'from [''"]./ui/button[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]./ui/card[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]./ui/input[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]./ui/modal[''"]', "from '@cortiware/ui'"
        $content = $content -replace 'from [''"]./ui/skeleton[''"]', "from '@cortiware/ui'"

        Set-Content $file -Value $content -NoNewline
        Write-Host "Updated: $file"
    } else {
        Write-Host "File not found: $file" -ForegroundColor Yellow
    }
}

Write-Host "`nAll imports updated successfully!" -ForegroundColor Green

