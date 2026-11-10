#Requires -Version 5.1
<#
  CI: install Mubaddil-Setup.exe silently (the website download), run the
  installed app, check a fix in Notepad and the single startup entry, then
  uninstall and check nothing is left in Startup.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Native = Split-Path -Parent $PSScriptRoot

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class SWin {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

Get-Process Mubaddil -ErrorAction SilentlyContinue | Stop-Process -Force
Get-AppxPackage -Name "8315AnasKhaled.24027DA5D7FEC" | Remove-AppxPackage -ErrorAction SilentlyContinue

$setup = Join-Path $Native "dist\Mubaddil-Setup.exe"
$sw = [Diagnostics.Stopwatch]::StartNew()
$p = Start-Process $setup -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART" -PassThru -Wait
Write-Host ("SETUP install exit {0} in {1:N1}s" -f $p.ExitCode, $sw.Elapsed.TotalSeconds)
$exe = Join-Path $env:LOCALAPPDATA "Mubaddil\Mubaddil.exe"
if (-not (Test-Path $exe)) { throw "SETUP FAIL: $exe not installed" }
$startupDir = [Environment]::GetFolderPath("Startup")
function Get-StartupEntries {
    @(Get-ChildItem $startupDir -ErrorAction SilentlyContinue |
        Where-Object { $_.Name -match "Mubaddil|مبدّل|مُبَدِل" } | ForEach-Object { $_.Name })
}

$fails = @()
Start-Process $exe | Out-Null
$ui = $null
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $ui = Get-Process Mubaddil -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
    if ($ui) { break }
}
if (-not $ui) { $fails += "installed app showed no window" }
Start-Sleep -Seconds 3
$entries = Get-StartupEntries
Write-Host "SETUP startup entries: [$($entries -join ', ')]"
if ($entries.Count -ne 1) { $fails += "expected exactly 1 startup entry, found $($entries.Count)" }

Start-Process notepad | Out-Null
Start-Sleep -Seconds 3
$h = (Get-Process notepad | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1).MainWindowHandle
[void][SWin]::SetForegroundWindow($h)
$r = New-Object SWin+RECT
[void][SWin]::GetWindowRect($h, [ref]$r)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point ([int](($r.Left + $r.Right) / 2)), ([int](($r.Top + $r.Bottom) / 2))
[SWin]::mouse_event(0x0002, 0, 0, 0, 0); [SWin]::mouse_event(0x0004, 0, 0, 0, 0)
Start-Sleep -Milliseconds 500
foreach ($ch in "hgsghl ".ToCharArray()) {
    [System.Windows.Forms.SendKeys]::SendWait([string]$ch)
    Start-Sleep -Milliseconds 120
}
Start-Sleep -Seconds 3
[System.Windows.Forms.SendKeys]::SendWait("^a")
[System.Windows.Forms.SendKeys]::SendWait("^c")
Start-Sleep -Milliseconds 400
$typed = Get-Clipboard -Raw
Write-Host "SETUP Notepad text: [$typed]"
if ($typed.Trim() -ne "السلام") { $fails += "installed app produced [$typed]" }
Get-Process notepad -ErrorAction SilentlyContinue | Stop-Process -Force

$unins = Join-Path $env:LOCALAPPDATA "Mubaddil\unins000.exe"
$u = Start-Process $unins -ArgumentList "/VERYSILENT", "/SUPPRESSMSGBOXES", "/NORESTART" -PassThru -Wait
Start-Sleep -Seconds 5
$left = Get-StartupEntries
$running = @(Get-Process Mubaddil -ErrorAction SilentlyContinue)
Write-Host "SETUP uninstall exit $($u.ExitCode); exe left: $(Test-Path $exe); startup left: [$($left -join ', ')]; running: $($running.Count)"
if (Test-Path $exe) { $fails += "exe still present after uninstall" }
if ($left.Count) { $fails += "startup entries left after uninstall" }
if ($running.Count) { $fails += "app still running after uninstall" }

if ($fails.Count) { throw ("SETUP FAIL: " + ($fails -join "; ")) }
Write-Host "SETUP OK"
