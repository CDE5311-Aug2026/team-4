@echo off
setlocal
where node >nul 2>nul
if errorlevel 1 (
  echo Please install Node.js, then run this launcher again.
  pause
  exit /b 1
)
node "%~dp0clementi-demo\scripts\preview-approved-local.cjs"
if errorlevel 1 pause
endlocal
