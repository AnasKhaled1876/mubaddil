# -*- mode: python ; coding: utf-8 -*-
from PyInstaller.utils.hooks import collect_submodules

hiddenimports = (
    collect_submodules("pynput")
    + collect_submodules("pystray")
    + collect_submodules("mubaddil")
    + [
        "tkinter",
        "tkinter.ttk",
        "PIL._tkinter_finder",
    ]
)

a = Analysis(
    ["launch.py"],
    pathex=[".."],
    binaries=[],
    datas=[("../assets/icon.png", "assets")],
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["pyobjc", "AppKit", "ApplicationServices"],
    noarchive=False,
)
pyz = PYZ(a.pure)
exe = EXE(
    pyz,
    a.scripts,
    [],
    exclude_binaries=True,
    name="Mubaddil",
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    console=False,
    icon="../assets/icon.ico",
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    name="Mubaddil",
)
