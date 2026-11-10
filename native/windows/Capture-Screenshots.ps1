#Requires -Version 5.1
<#
  CI smoke test: start the built exe, check it stays up and shows a window,
  then save screenshots to native/dist/screenshots/.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Native = Split-Path -Parent $PSScriptRoot
$out = Join-Path $Native "dist\screenshots"
New-Item -ItemType Directory -Force -Path $out | Out-Null

try { Set-DisplayResolution -Width 1920 -Height 1080 -Force -ErrorAction Stop } catch {
    Write-Host "Could not change resolution: $($_.Exception.Message)"
}

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Win {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  public struct RECT { public int Left, Top, Right, Bottom; }
}
"@

function Save-Screen([string]$name) {
    $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds
    $bmp = New-Object System.Drawing.Bitmap $b.Width, $b.Height
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($b.Location, [System.Drawing.Point]::Empty, $b.Size)
    $bmp.Save((Join-Path $out "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

function Save-Window([IntPtr]$h, [string]$name) {
    $r = New-Object Win+RECT
    [void][Win]::GetWindowRect($h, [ref]$r)
    $w = $r.Right - $r.Left; $hgt = $r.Bottom - $r.Top
    if ($w -le 0 -or $hgt -le 0) { return }
    $bmp = New-Object System.Drawing.Bitmap $w, $hgt
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($r.Left, $r.Top, 0, 0, (New-Object System.Drawing.Size $w, $hgt))
    $bmp.Save((Join-Path $out "$name.png"), [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
}

$exe = Join-Path $Native "dist\Mubaddil\Mubaddil.exe"
$env:MUBADDIL_DEBUG = "1"
function Get-UiProcess {
    Get-Process Mubaddil -ErrorAction SilentlyContinue |
        Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1
}
$proc = Start-Process $exe -PassThru
$ui = $null
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $proc.Refresh()
    if ($proc.HasExited) { break }
    $ui = Get-UiProcess
    if ($ui) { break }
}
$log = Join-Path $env:LOCALAPPDATA "Mubaddil\error.log"
if ($proc.HasExited) {
    if (Test-Path $log) { Get-Content $log }
    throw "Mubaddil exited during startup (code $($proc.ExitCode))."
}
if (-not $ui) {
    Save-Screen "no-window"
    if (Test-Path $log) { Get-Content $log }
    throw "Mubaddil started but showed no window within 60s."
}
Write-Host "Main process $($proc.Id); settings window process $($ui.Id)"
Start-Sleep -Seconds 3
(New-Object -ComObject Shell.Application).MinimizeAll()
Start-Sleep -Seconds 2
$second0 = Start-Process $exe -PassThru   # brings our window back to the front
Start-Sleep -Seconds 3
$proc.Refresh()
[void][Win]::SetForegroundWindow((Get-UiProcess).MainWindowHandle)
Start-Sleep -Seconds 1
Save-Screen "01-desktop"
Save-Window (Get-UiProcess).MainWindowHandle "01-window"

# Demo: click into the "try it" box and type Arabic meant as English keys.
$r = New-Object Win+RECT
[void][Win]::GetWindowRect((Get-UiProcess).MainWindowHandle, [ref]$r)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point (($r.Left + $r.Right) / 2), ($r.Top + 290)
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class Mouse {
  [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
}
"@
[Mouse]::mouse_event(0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004, 0, 0, 0, 0)
Start-Sleep -Milliseconds 500
foreach ($ch in "hgsghl ".ToCharArray()) {
    [System.Windows.Forms.SendKeys]::SendWait([string]$ch)
    Start-Sleep -Milliseconds 120
}
Start-Sleep -Seconds 3
Save-Screen "02-desktop"
Save-Window (Get-UiProcess).MainWindowHandle "02-window"

# Switch the UI to Arabic with the language button (top corner) and capture again.
[void][Win]::GetWindowRect((Get-UiProcess).MainWindowHandle, [ref]$r)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point ($r.Left + 446), ($r.Top + 74)
[Mouse]::mouse_event(0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004, 0, 0, 0, 0)
Start-Sleep -Seconds 2
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point 1500, 900
Start-Sleep -Milliseconds 500
Save-Window (Get-UiProcess).MainWindowHandle "04-window-ar"

# Same check in another app: Notepad, read back through the clipboard.
$np = Start-Process notepad -PassThru
Start-Sleep -Seconds 3
$np.Refresh()
$npWin = (Get-Process notepad | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1).MainWindowHandle
[void][Win]::SetForegroundWindow($npWin)
Start-Sleep -Seconds 1
[void][Win]::GetWindowRect($npWin, [ref]$r)
[System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point (($r.Left + $r.Right) / 2), (($r.Top + $r.Bottom) / 2)
[Mouse]::mouse_event(0x0002, 0, 0, 0, 0); [Mouse]::mouse_event(0x0004, 0, 0, 0, 0)
Start-Sleep -Milliseconds 500
foreach ($ch in "hgsghl ".ToCharArray()) {
    [System.Windows.Forms.SendKeys]::SendWait([string]$ch)
    Start-Sleep -Milliseconds 120
}
Start-Sleep -Seconds 3
Save-Screen "03-notepad"
[System.Windows.Forms.SendKeys]::SendWait("^a")
[System.Windows.Forms.SendKeys]::SendWait("^c")
Start-Sleep -Milliseconds 500
$typed = (Get-Clipboard -Raw)
Write-Host "Notepad text: [$typed]"
[System.Windows.Forms.SendKeys]::SendWait("{END}")
Start-Sleep -Milliseconds 300
[System.Windows.Forms.SendKeys]::SendWait("%z")
Start-Sleep -Seconds 2
[System.Windows.Forms.SendKeys]::SendWait("^a")
[System.Windows.Forms.SendKeys]::SendWait("^c")
Start-Sleep -Milliseconds 500
$undone = (Get-Clipboard -Raw)
Write-Host "After Alt+Z: [$undone]"
if (Test-Path $log) { Write-Host "error.log:"; Get-Content $log }
$dbg = Join-Path $env:LOCALAPPDATA "Mubaddil\debug.log"
if (Test-Path $dbg) { Write-Host "debug.log:"; Get-Content $dbg | Select-Object -Last 80 }
$cfg = Join-Path $env:APPDATA "Mubaddil"
if (Test-Path $cfg) { Get-ChildItem $cfg | ForEach-Object { Write-Host "config $($_.Name):"; Get-Content $_.FullName } }
Get-Process notepad -ErrorAction SilentlyContinue | Stop-Process -Force
$fixOk = ($typed.Trim() -eq "السلام")

# Probe: does SendInput from Python reach Notepad, with and without Mubaddil running?
$py = Join-Path $Native ".venv\Scripts\python.exe"
$probe = Join-Path $PSScriptRoot "ci\inject_probe.py"
function Probe-Notepad([string]$label) {
    $n = Start-Process notepad -PassThru
    Start-Sleep -Seconds 2
    $h = (Get-Process notepad | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1).MainWindowHandle
    [void][Win]::SetForegroundWindow($h)
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait("x")
    & $py $probe batch
    & $py $probe batch-del
    & $py $probe keywise
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    [System.Windows.Forms.SendKeys]::SendWait("^c")
    Start-Sleep -Milliseconds 300
    Write-Host "PROBE [$label]: [$(Get-Clipboard -Raw)]  (expect xACDEF)"
    Get-Process notepad -ErrorAction SilentlyContinue | Stop-Process -Force
}
Probe-Notepad "app running"

# A second launch must bring the existing window back, not start a new copy.
$second = Start-Process $exe -PassThru
Start-Sleep -Seconds 5
$second.Refresh()
if (-not $second.HasExited) { throw "Second launch did not hand off to the running instance." }
$proc.Refresh()
if ($proc.HasExited) { throw "Running instance died after a second launch." }

Write-Host "Window title: $((Get-UiProcess).MainWindowTitle)"
Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1
Probe-Notepad "app stopped"
if (-not $fixOk) { throw "Correction in Notepad produced [$typed], expected [السلام ]" }
if ($undone.Trim() -ne "hgsghl") { throw "Alt+Z produced [$undone], expected [hgsghl ]" }
Get-ChildItem $out
