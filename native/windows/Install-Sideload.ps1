#Requires -Version 5.1
# Run this from the folder that contains Mubaddil.msix and Mubaddil.cer
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$here = $PSScriptRoot
if (-not $here) { $here = Get-Location }
$msix = Join-Path $here "Mubaddil.msix"
$cer = Join-Path $here "Mubaddil.cer"
if (-not (Test-Path $msix)) { throw "Mubaddil.msix not found next to this script." }

if (Test-Path $cer) {
    Write-Host "Trusting the publisher certificate (one time)..."
    try {
        Import-Certificate -FilePath $cer -CertStoreLocation Cert:\LocalMachine\TrustedPeople | Out-Null
    } catch {
        Import-Certificate -FilePath $cer -CertStoreLocation Cert:\CurrentUser\TrustedPeople | Out-Null
    }
}

Write-Host "Installing Mubaddil..."
Add-AppxPackage -Path $msix
Write-Host "Done. Open مبدّل from the Start menu, then type hgsghl and space."
