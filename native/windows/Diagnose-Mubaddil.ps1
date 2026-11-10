# Mubaddil diagnostics. Collects facts about this PC, restarts Mubaddil with a
# short debug trace, asks you to type one test word in Notepad, and saves a
# report to the Desktop (mubaddil-report.txt). Debug mode is turned off again
# and the keystroke trace is deleted at the end.
$ErrorActionPreference = "Continue"
$PkgName = "8315AnasKhaled.24027DA5D7FEC"
$report = New-Object System.Collections.Generic.List[string]
function Add-Line([string]$s) { $report.Add($s); Write-Host $s }

$os = Get-CimInstance Win32_OperatingSystem
Add-Line "== Windows: $($os.Caption) $($os.Version) ($([Environment]::Is64BitOperatingSystem))"
Add-Line "== Antivirus:"
Get-CimInstance -Namespace root/SecurityCenter2 -ClassName AntiVirusProduct -ErrorAction SilentlyContinue |
    ForEach-Object { Add-Line "   $($_.displayName)" }
Add-Line "== Keyboard languages:"
Get-WinUserLanguageList | ForEach-Object { Add-Line "   $($_.LanguageTag): $($_.InputMethodTips -join ', ')" }
Add-Line "== WebView2: $((Get-ItemProperty 'HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}' -ErrorAction SilentlyContinue).pv)"

$pkg = Get-AppxPackage -Name $PkgName
Add-Line "== Store version: $(if ($pkg) { $pkg.Version } else { 'not installed' })"
$siteExe = Join-Path $env:LOCALAPPDATA "Mubaddil\Mubaddil.exe"
Add-Line "== Website version installed: $(Test-Path $siteExe)"
Add-Line "== Startup entries:"
Get-ChildItem ([Environment]::GetFolderPath("Startup")) -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match "Mubaddil|مبد" } | ForEach-Object { Add-Line "   $($_.Name)" }
Add-Line "== Running before restart:"
Get-Process Mubaddil -ErrorAction SilentlyContinue | ForEach-Object { Add-Line "   $($_.Id) $($_.Path)" }

# Restart with a debug trace.
$flag = Join-Path $HOME ".mubaddil-debug"
New-Item -ItemType File -Force -Path $flag | Out-Null
Get-Process Mubaddil -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 1
if ($pkg) {
    Start-Process "explorer.exe" "shell:AppsFolder\$($pkg.PackageFamilyName)!Mubaddil"
} elseif (Test-Path $siteExe) {
    Start-Process $siteExe
}
Start-Sleep -Seconds 8
Add-Line "== Running after restart:"
Get-Process Mubaddil -ErrorAction SilentlyContinue | ForEach-Object { Add-Line "   $($_.Id) $($_.Path)" }

Start-Process notepad
Write-Host ""
Write-Host "Notepad is open. Switch the keyboard to ENGLISH, click in Notepad," -ForegroundColor Yellow
Write-Host "type:  hgsghl  then press Space. Then come back here and press Enter." -ForegroundColor Yellow
Read-Host | Out-Null

$logDirs = @(Join-Path $env:LOCALAPPDATA "Mubaddil")
$logDirs += Get-ChildItem (Join-Path $env:LOCALAPPDATA "Packages") -Directory -Filter "$PkgName*" -ErrorAction SilentlyContinue |
    ForEach-Object { $_.FullName }
Add-Line "== Logs:"
$traces = @()
foreach ($dir in $logDirs) {
    Get-ChildItem $dir -Recurse -File -Include debug.log, error.log -ErrorAction SilentlyContinue | ForEach-Object {
        Add-Line "-- $($_.FullName)"
        Get-Content $_.FullName -Tail 80 -Encoding UTF8 | ForEach-Object { Add-Line "   $_" }
        if ($_.Name -eq "debug.log") { $traces += $_.FullName }
    }
}

# Turn debug mode off again and delete the keystroke trace.
Remove-Item $flag -Force -ErrorAction SilentlyContinue
Get-Process Mubaddil -ErrorAction SilentlyContinue | Stop-Process -Force
$traces | ForEach-Object { Remove-Item $_ -Force -ErrorAction SilentlyContinue }
Start-Sleep -Seconds 1
if ($pkg) { Start-Process "explorer.exe" "shell:AppsFolder\$($pkg.PackageFamilyName)!Mubaddil" }

$out = Join-Path ([Environment]::GetFolderPath("Desktop")) "mubaddil-report.txt"
$report | Set-Content -Path $out -Encoding UTF8
Write-Host ""
Write-Host "Saved: $out  (send this file back)" -ForegroundColor Green
