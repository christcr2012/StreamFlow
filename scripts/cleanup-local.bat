@echo off
REM ===================================================================
REM Clean up debugging files from local development environment
REM Run this in VS Code PowerShell/Command Prompt 
REM ===================================================================

echo 🧹 Cleaning up debugging files from attached_assets...
echo.

REM Remove the problematic TypeScript debugging file
if exist "attached_assets\me_1758869662882.ts" (
    echo ❌ Removing: attached_assets\me_1758869662882.ts
    del "attached_assets\me_1758869662882.ts"
) else (
    echo ✅ File not found: attached_assets\me_1758869662882.ts
)

REM Check for any other TypeScript/JavaScript files in attached_assets
echo.
echo 🔍 Checking for other problematic files...
for /r attached_assets %%f in (*.ts *.js *.tsx *.jsx) do (
    echo ⚠️  Found: %%f
    echo    You may want to review and remove this file if it's not needed
)

echo.
echo ✅ Cleanup complete! 
echo.
echo Now try running: npm run build