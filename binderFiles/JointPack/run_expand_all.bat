@echo off
setlocal ENABLEDELAYEDEXPANSION
title StreamFlow JointPack Expander

echo.
echo === StreamFlow JointPack Expander ===
echo.

set /p BINDER_DIR=Enter the absolute path to your binders folder (e.g., C:\Users\You\repo): 

if not exist "%BINDER_DIR%" (
  echo [ERROR] Folder not found: %BINDER_DIR%
  pause
  exit /b 1
)

python "%~dp0scripts\expander.py" --root "%BINDER_DIR%" --report "%BINDER_DIR%\EXPAND-REPORT.md"
if %ERRORLEVEL% NEQ 0 (
  echo [ERROR] Expander failed.
  pause
  exit /b 1
)

python "%~dp0scripts\validate_links.py" --root "%BINDER_DIR%" --report "%BINDER_DIR%\EXPAND-REPORT.md"
if %ERRORLEVEL% NEQ 0 (
  echo [WARN] Link validation had issues; see EXPAND-REPORT.md
)

echo.
echo Done. FULL binders written next to originals. See EXPAND-REPORT.md for details.
pause
