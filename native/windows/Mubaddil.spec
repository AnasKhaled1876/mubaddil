# -*- mode: python ; coding: utf-8 -*-
import os
import sys
from PyInstaller.utils.hooks import collect_all, collect_submodules

native_dir = os.path.abspath(os.path.join(SPECPATH, ".."))
sys.path.insert(0, native_dir)

mubaddil_datas, mubaddil_binaries, mubaddil_hidden = collect_all("mubaddil")
tk_datas, tk_binaries, tk_hidden = collect_all("tkinter")

hiddenimports = (
    collect_submodules("pynput")
    + collect_submodules("pystray")
    + mubaddil_hidden
    + tk_hidden
    + [
        "mubaddil",
        "mubaddil.__main__",
        "mubaddil.engine",
        "mubaddil.ime",
        "mubaddil.tray",
        "mubaddil.hook",
        "mubaddil.window",
        "mubaddil.startup",
        "mubaddil.paths",
        "tkinter",
        "tkinter.ttk",
        "_tkinter",
        "PIL._tkinter_finder",
    ]
)

a = Analysis(
    [os.path.join(SPECPATH, "launch.py")],
    pathex=[native_dir],
    binaries=mubaddil_binaries + tk_binaries,
    datas=mubaddil_datas
    + tk_datas
    + [(os.path.join(native_dir, "assets", "icon.png"), "assets")],
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
    icon=os.path.join(native_dir, "assets", "icon.ico"),
)
coll = COLLECT(
    exe,
    a.binaries,
    a.datas,
    strip=False,
    upx=True,
    name="Mubaddil",
)
