#Requires -Version 5.1
<#
  CI: install the signed MSIX like a user would, launch the packaged app from
  shell:AppsFolder, and check that typing hgsghl + Space gets fixed in Notepad
  and in Mubaddil's own window. Prints install time and the app's logs.
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Native = Split-Path -Parent $PSScriptRoot
$out = Join-Path $Native "dist\screenshots"
New-Item -ItemType Directory -Force -Path $out | Out-Null

Add-Type -AssemblyName System.Windows.Forms, System.Drawing
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class PWin {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr h, out RECT r);
  [DllImport("user32.dll")] public static extern void mouse_event(int f, int x, int y, int d, int e);
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
function Click-At([int]$x, [int]$y) {
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point $x, $y
    [PWin]::mouse_event(0x0002, 0, 0, 0, 0); [PWin]::mouse_event(0x0004, 0, 0, 0, 0)
}
function Type-Slowly([string]$text) {
    foreach ($ch in $text.ToCharArray()) {
        [System.Windows.Forms.SendKeys]::SendWait([string]$ch)
        Start-Sleep -Milliseconds 120
    }
}
function Read-Notepad {
    [System.Windows.Forms.SendKeys]::SendWait("^a")
    [System.Windows.Forms.SendKeys]::SendWait("^c")
    Start-Sleep -Milliseconds 400
    return (Get-Clipboard -Raw)
}

Get-Process Mubaddil -ErrorAction SilentlyContinue | Stop-Process -Force
New-Item -ItemType File -Force -Path (Join-Path $HOME ".mubaddil-debug") | Out-Null

$cer = Join-Path $Native "dist\Mubaddil.cer"
$msix = Join-Path $Native "dist\Mubaddil.msix"
Import-Certificate -FilePath $cer -CertStoreLocation Cert:\LocalMachine\TrustedPeople | Out-Null
Import-Certificate -FilePath $cer -CertStoreLocation Cert:\LocalMachine\Root | Out-Null

$sw = [Diagnostics.Stopwatch]::StartNew()
Add-AppxPackage -Path $msix
Write-Host ("PACKAGED install took {0:N1}s" -f $sw.Elapsed.TotalSeconds)
$pkg = Get-AppxPackage -Name "8315AnasKhaled.24027DA5D7FEC"
Write-Host "PACKAGED installed: $($pkg.PackageFullName) at $($pkg.InstallLocation)"

Start-Process "explorer.exe" "shell:AppsFolder\$($pkg.PackageFamilyName)!Mubaddil"
# Stress: keyboard and mouse input while the app (and WebView2) is still starting.
$stressEnd = (Get-Date).AddSeconds(10)
$i = 0
while ((Get-Date) -lt $stressEnd) {
    [System.Windows.Forms.Cursor]::Position = New-Object System.Drawing.Point (800 + ($i % 50)), (500 + ($i % 30))
    [System.Windows.Forms.SendKeys]::SendWait("{SCROLLLOCK}{SCROLLLOCK}")
    Start-Sleep -Milliseconds 60
    $i++
}
Write-Host "PACKAGED sent $i input bursts during startup"
$proc = $null
$deadline = (Get-Date).AddSeconds(60)
while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    $proc = Get-Process Mubaddil -ErrorAction SilentlyContinue |
        Where-Object { $_.Path -like "*WindowsApps*" -and $_.MainWindowHandle -ne [IntPtr]::Zero } |
        Select-Object -First 1
    if ($proc) { break }
}
$procs = Get-Process Mubaddil -ErrorAction SilentlyContinue | ForEach-Object { "$($_.Id) $($_.Path)" }
Write-Host "PACKAGED processes: $($procs -join ' | ')"
Save-Screen "p01-launched"

$fails = @()
if (-not $proc) {
    $fails += "packaged app showed no window within 60s"
} else {
    Start-Sleep -Seconds 3
    [void][PWin]::SetForegroundWindow($proc.MainWindowHandle)
    $r = New-Object PWin+RECT
    [void][PWin]::GetWindowRect($proc.MainWindowHandle, [ref]$r)
    Click-At ([int](($r.Left + $r.Right) / 2)) ($r.Top + 290)
    Start-Sleep -Milliseconds 500
    Type-Slowly "hgsghl "
    Start-Sleep -Seconds 3
    Save-Screen "p02-own-window"

    $np = Start-Process notepad -PassThru
    Start-Sleep -Seconds 3
    $h = (Get-Process notepad | Where-Object { $_.MainWindowHandle -ne [IntPtr]::Zero } | Select-Object -First 1).MainWindowHandle
    [void][PWin]::SetForegroundWindow($h)
    Start-Sleep -Milliseconds 500
    [void][PWin]::GetWindowRect($h, [ref]$r)
    Click-At ([int](($r.Left + $r.Right) / 2)) ([int](($r.Top + $r.Bottom) / 2))
    Start-Sleep -Milliseconds 500
    Type-Slowly "hgsghl "
    Start-Sleep -Seconds 3
    Save-Screen "p03-notepad"
    $typed = Read-Notepad
    Write-Host "PACKAGED Notepad text: [$typed]"
    if ($typed.Trim() -ne "السلام") { $fails += "packaged Notepad produced [$typed]" }

    # Again after the settings window has been polling for a while.
    Start-Sleep -Seconds 12
    [System.Windows.Forms.SendKeys]::SendWait("{END}")
    Click-At ([int](($r.Left + $r.Right) / 2)) ([int](($r.Top + $r.Bottom) / 2) + 40)
    Start-Sleep -Milliseconds 500
    [System.Windows.Forms.SendKeys]::SendWait("^a{DEL}")
    Start-Sleep -Milliseconds 300
    Click-At ([int](($r.Left + $r.Right) / 2)) ([int](($r.Top + $r.Bottom) / 2))
    Start-Sleep -Milliseconds 500
    Type-Slowly "hgsghl "
    Start-Sleep -Seconds 3
    $typed2 = Read-Notepad
    Write-Host "PACKAGED Notepad text (2nd): [$typed2]"
    if ($typed2.Trim() -ne "السلام") { $fails += "packaged Notepad (2nd) produced [$typed2]" }
    Get-Process notepad -ErrorAction SilentlyContinue | Stop-Process -Force
}

Write-Host "---- packaged app logs ----"
$roots = @((Join-Path $env:LOCALAPPDATA "Mubaddil"), (Join-Path $env:LOCALAPPDATA "Packages\$($pkg.PackageFamilyName)"))
foreach ($root in $roots) {
    if (-not (Test-Path $root)) { continue }
    Get-ChildItem $root -Recurse -File -Include *.log, config.json -ErrorAction SilentlyContinue | ForEach-Object {
        Write-Host "== $($_.FullName)"
        Get-Content $_.FullName -Tail 60
    }
}
Get-Process Mubaddil -ErrorAction SilentlyContinue | Stop-Process -Force
if ($fails.Count) { throw ("PACKAGED FAIL: " + ($fails -join "; ")) }
Write-Host "PACKAGED OK"
