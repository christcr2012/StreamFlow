# Fix remaining relation name issues

$files = Get-ChildItem -Path "apps/tenant-app/src" -Recurse -Filter "*.ts*" -File

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -ErrorAction SilentlyContinue
    if ($null -eq $content) { continue }
    
    $originalContent = $content
    
    # Fix Agreement template relation
    $content = $content -replace '(\s+)template:\s*\{', '$1AgreementTemplate: {'
    
    # Fix Cleaning vertical relations in includes
    $content = $content -replace 'include:\s*\{\s*workOrders:', 'include: { CleaningWorkOrder:'
    $content = $content -replace 'include:\s*\{\s*contract:', 'include: { CleaningContract:'
    
    # Fix Cleaning vertical relations in selects
    $content = $content -replace 'select:\s*\{\s*contract:', 'select: { CleaningContract:'
    $content = $content -replace 'select:\s*\{\s*estimate:', 'select: { CleaningEstimate:'
    
    # Fix _count selects
    $content = $content -replace '(\s+)invoices:\s*true\s*\}', '$1Invoice: true }'
    $content = $content -replace '(\s+)timeline:\s*true\s*\}', '$1JobTimeline: true }'
    
    # Fix include payments
    $content = $content -replace 'include:\s*\{\s*payments:', 'include: { Payment:'
    
    # Fix include lineItems
    $content = $content -replace 'include:\s*\{\s*lineItems:', 'include: { InvoiceLine:'
    
    # Fix include jobs
    $content = $content -replace 'include:\s*\{\s*jobs:', 'include: { Job:'
    
    # Fix select customer
    $content = $content -replace 'select:\s*\{\s*customer:', 'select: { Customer:'
    
    # Fix where job
    $content = $content -replace 'where:\s*\{\s*job:', 'where: { Job:'
    
    if ($content -ne $originalContent) {
        Set-Content $file.FullName -Value $content -NoNewline
        Write-Host "Fixed: $($file.FullName)"
    }
}

Write-Host "`nDone!"

