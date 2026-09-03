# مبدّل — Mubaddil

System-wide fixer for the Arabic/English wrong-keyboard problem. It remaps the **physical keys** you already pressed, then switches the OS input language.

`hgsghl` → `السلام`

## Windows: MSIX installer

This is a **full-trust** desktop MSIX (needed so a global keyboard hook works). It is not a Store sandbox app.

Build it on GitHub Actions or any Windows PC — not on this Mac.

### Build

Push the repo to GitHub, then run the **Build Windows MSIX** workflow. Download the `Mubaddil-msix` artifact: `Mubaddil.msix`, `Mubaddil.cer`, and `Install-Sideload.ps1`.

Or on a Windows machine:

```powershell
powershell -ExecutionPolicy Bypass -File native\windows\Build-Msix.ps1
```

### Install on the boss PC

1. Put the three files in one folder.
2. Right-click `Install-Sideload.ps1` → Run with PowerShell (or Developer Mode, then double-click `Mubaddil.msix`).
3. Open **مبدّل** from the Start menu.
4. Type `hgsghl` then space.

It appears in Start, can start at login, and uninstalls from Settings → Apps like any other MSIX.

The first install trusts a self-signed `CN=Mubaddil` certificate. For a company PC, replace that with your org code-signing cert in `Build-Msix.ps1`.

## macOS

```bash
./native/run.sh
```

Allow Accessibility. Undo: Option+Z.
