@echo off
setlocal
cd /d "%~dp0.."
if exist ".venv\Scripts\pythonw.exe" (
  start "" ".venv\Scripts\pythonw.exe" -m mubaddil
  exit /b 0
)
if exist ".venv\Scripts\python.exe" (
  start "" ".venv\Scripts\python.exe" -m mubaddil
  exit /b 0
)
echo Python environment missing. Run Install-Mubaddil.ps1
pause
