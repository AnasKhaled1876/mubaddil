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
$proc = Start-Process $exe -PassThru
$deadline = (Get-Date).AddSeconds(45)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $proc.Refresh()
    if ($proc.HasExited) { break }
    if ($proc.MainWindowHandle -ne [IntPtr]::Zero) { break }
}
$log = Join-Path $env:LOCALAPPDATA "Mubaddil\error.log"
if ($proc.HasExited) {
    if (Test-Path $log) { Get-Content $log }
    throw "Mubaddil exited during startup (code $($proc.ExitCode))."
}
if ($proc.MainWindowHandle -eq [IntPtr]::Zero) {
    Save-Screen "no-window"
    if (Test-Path $log) { Get-Content $log }
    throw "Mubaddil started but showed no window within 45s."
}
Start-Sleep -Seconds 3
[void][Win]::SetForegroundWindow($proc.MainWindowHandle)
Start-Sleep -Seconds 1
Save-Screen "01-desktop"
Save-Window $proc.MainWindowHandle "01-window"

# A second launch must bring the existing window back, not start a new copy.
$second = Start-Process $exe -PassThru
Start-Sleep -Seconds 5
$second.Refresh()
if (-not $second.HasExited) { throw "Second launch did not hand off to the running instance." }
$proc.Refresh()
if ($proc.HasExited) { throw "Running instance died after a second launch." }

Write-Host "Window title: $($proc.MainWindowTitle)"
Stop-Process -Id $proc.Id -Force
Get-ChildItem $out
