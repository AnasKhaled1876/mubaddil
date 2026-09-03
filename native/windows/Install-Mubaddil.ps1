#Requires -Version 5.1
<#
  Installs Mubaddil on this Windows PC:
  - copies the app to %LOCALAPPDATA%\Mubaddil
  - installs Python if needed
  - creates a hidden venv
  - adds Arabic (101) if missing
  - Start Menu + startup shortcuts
  - launches the control window
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

function Assert-Python {
    $py = Get-Command python -ErrorAction SilentlyContinue
    if ($py) { return "python" }
    $py = Get-Command py -ErrorAction SilentlyContinue
    if ($py) { return "py -3" }
    Write-Host "Installing Python with winget..."
    winget install -e --id Python.Python.3.12 --accept-package-agreements --accept-source-agreements
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" +
                [System.Environment]::GetEnvironmentVariable("Path", "User")
    $py = Get-Command python -ErrorAction SilentlyContinue
    if (-not $py) { throw "Python is required. Install it from https://python.org and tick 'Add python.exe to PATH'." }
    return "python"
}

function Ensure-ArabicKeyboard {
    try {
        $list = Get-WinUserLanguageList
        $hasAr = $list | Where-Object { $_.LanguageTag -like "ar*" }
        if (-not $hasAr) {
            Write-Host "Adding Arabic keyboard (101)..."
            $list.Add("ar-SA")
            Set-WinUserLanguageList $list -Force
        }
    } catch {
        Write-Warning "Could not add Arabic automatically. Add it from Settings → Time & language → Language & region → Arabic → Arabic (101)."
    }
}

$Source = Split-Path -Parent $PSScriptRoot
$Dest = Join-Path $env:LOCALAPPDATA "Mubaddil"

Write-Host "Installing Mubaddil to $Dest"
New-Item -ItemType Directory -Force -Path $Dest | Out-Null

robocopy $Source $Dest /E /XD .venv bin __pycache__ /NFL /NDL /NJH /NJS /nc /ns /np | Out-Null
if ($LASTEXITCODE -ge 8) { throw "Failed to copy files to $Dest" }

$python = Assert-Python
Push-Location $Dest
try {
    if (-not (Test-Path ".\.venv\Scripts\python.exe")) {
        Write-Host "Creating Python environment..."
        Invoke-Expression "$python -m venv .venv"
    }
    Write-Host "Installing packages..."
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
} finally {
    Pop-Location
}

Ensure-ArabicKeyboard

$wsh = New-Object -ComObject WScript.Shell
$startMenu = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Mubaddil.lnk"
$startup = Join-Path $env:APPDATA "Microsoft\Windows\Start Menu\Programs\Startup\Mubaddil.lnk"
$target = Join-Path $Dest "windows\Start-Mubaddil.vbs"
$icon = Join-Path $Dest "assets\icon.png"

foreach ($path in @($startMenu, $startup)) {
    $shortcut = $wsh.CreateShortcut($path)
    $shortcut.TargetPath = "wscript.exe"
    $shortcut.Arguments = "`"$target`""
    $shortcut.WorkingDirectory = $Dest
    $shortcut.WindowStyle = 7
    $shortcut.Description = "مبدّل — fixes wrong Arabic/English keyboard typing"
    if (Test-Path $icon) { $shortcut.IconLocation = $icon }
    $shortcut.Save()
}

Write-Host ""
Write-Host "Installed. Launching Mubaddil..."
Write-Host "Type hgsghl then space in the window or in Word/WhatsApp."
Start-Process -FilePath "wscript.exe" -ArgumentList "`"$target`""
