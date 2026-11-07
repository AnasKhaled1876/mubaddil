# مبدّل — Mubaddil

System-wide fixer for the Arabic/English wrong-keyboard problem. It remaps the **physical keys** you already pressed, then switches the OS input language.

`hgsghl` → `السلام`

## Windows: send one file

Send **`Mubaddil-Setup.exe`**. He double-clicks it, hits Next, done. No admin, no PowerShell, no certificate.

If SmartScreen says “Windows protected your PC”: **More info → Run anyway** (unsigned build; a paid code-signing cert removes that).

If Kaspersky quarantines `Mubaddil-Setup.exe`: restore it from Quarantine, then add an exclusion for the file and later `%LocalAppData%\Mubaddil`. Do not turn antivirus off. The installer must not add exclusions for you — that looks like malware and makes the flag worse.

The MSIX is still produced for later Store/sideload use. It cannot be one-tap without Store signing or a trusted publisher cert.

## macOS

```bash
./native/run.sh
```

Allow Accessibility. Undo: Option+Z.
