#Requires -Version 5.1
<#
  Build a full-trust MSIX on Windows (GitHub Actions or a Windows PC).
  Output: native/dist/Mubaddil.msix + Mubaddil.cer
#>
Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$Native = Split-Path -Parent $PSScriptRoot
Set-Location $Native

function Find-SdkTool([string]$name) {
    $roots = @(
        "${env:ProgramFiles(x86)}\Windows Kits\10\bin",
        "${env:ProgramFiles}\Windows Kits\10\bin"
    )
    foreach ($root in $roots) {
        if (-not (Test-Path $root)) { continue }
        $match = Get-ChildItem $root -Recurse -Filter $name -ErrorAction SilentlyContinue |
            Where-Object { $_.DirectoryName -match "\\x64$" } |
            Sort-Object FullName -Descending |
            Select-Object -First 1
        if ($match) { return $match.FullName }
    }
    throw "Could not find $name. Install the Windows 10/11 SDK."
}

if (-not (Test-Path .\.venv\Scripts\python.exe)) {
    python -m venv .venv
}
.\.venv\Scripts\python.exe -m pip install --upgrade pip
.\.venv\Scripts\python.exe -m pip install -r requirements.txt pyinstaller

Write-Host "Generating logos..."
.\.venv\Scripts\python.exe windows\generate_assets.py

Write-Host "Building Win32 exe..."
Remove-Item -Recurse -Force dist, build -ErrorAction SilentlyContinue
.\.venv\Scripts\pyinstaller.exe --noconfirm --clean --distpath dist --workpath build windows\Mubaddil.spec

Write-Host "Building double-click Setup.exe..."
choco install innosetup --no-progress -y
$iscc = "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe"
if (-not (Test-Path $iscc)) { $iscc = "${env:ProgramFiles}\Inno Setup 6\ISCC.exe" }
& $iscc windows\Mubaddil.iss
if ($LASTEXITCODE -ne 0) {
    throw "Inno Setup compile failed with exit code $LASTEXITCODE"
}

$pkg = Join-Path $Native "dist\Mubaddil"
Copy-Item windows\AppxManifest.xml (Join-Path $pkg "AppxManifest.xml") -Force
$assets = Join-Path $pkg "Assets"
New-Item -ItemType Directory -Force -Path $assets | Out-Null
Copy-Item windows\Assets\* $assets -Force

$makeappx = Find-SdkTool "makeappx.exe"
$signtool = Find-SdkTool "signtool.exe"
$msix = Join-Path $Native "dist\Mubaddil.msix"
if (Test-Path $msix) { Remove-Item $msix -Force }

Write-Host "Packing MSIX..."
& $makeappx pack /d $pkg /p $msix /o

$cer = Join-Path $Native "dist\Mubaddil.cer"
$pfx = Join-Path $env:TEMP "Mubaddil.pfx"
$pass = ConvertTo-SecureString "mubaddil" -AsPlainText -Force
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject "CN=Mubaddil" `
    -KeyUsage DigitalSignature -FriendlyName "Mubaddil" `
    -CertStoreLocation "Cert:\CurrentUser\My"
Export-PfxCertificate -Cert $cert -FilePath $pfx -Password $pass | Out-Null
Export-Certificate -Cert $cert -FilePath $cer | Out-Null

Write-Host "Signing..."
& $signtool sign /fd SHA256 /a /f $pfx /p mubaddil $msix

Copy-Item (Join-Path $PSScriptRoot "Install-Sideload.ps1") (Join-Path $Native "dist\Install-Sideload.ps1") -Force

Write-Host ""
Write-Host "Built:"
Write-Host "  $msix"
Write-Host "  $cer"
Write-Host "On the boss PC: run Install-Sideload.ps1 from the same folder, or enable Developer Mode and double-click the MSIX."
