import os
import sys
from pathlib import Path


def frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def startup_dir() -> Path:
    appdata = os.environ.get("APPDATA") or str(Path.home())
    return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" / "Startup"


def start_menu_dir() -> Path:
    appdata = os.environ.get("APPDATA") or str(Path.home())
    return Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs"


def launcher_bat() -> Path:
    return Path(__file__).resolve().parents[1] / "windows" / "Start-Mubaddil.bat"


def is_enabled() -> bool:
    if not sys.platform.startswith("win"):
        return False
    folder = startup_dir()
    return (folder / "Mubaddil.vbs").exists() or (folder / "Mubaddil.bat").exists()


def _write_hidden_exe_launcher(path: Path) -> None:
    exe = Path(sys.executable)
    path.write_text(
        "Set sh = CreateObject(\"Wscript.Shell\")\r\n"
        f'sh.Run """{exe}""", 0, False\r\n',
        encoding="ascii",
        newline="\r\n",
    )


def set_enabled(enabled: bool) -> None:
    if not sys.platform.startswith("win"):
        return
    from .paths import is_msix

    if is_msix():
        return
    folder = startup_dir()
    folder.mkdir(parents=True, exist_ok=True)
    bat = folder / "Mubaddil.bat"
    vbs = folder / "Mubaddil.vbs"
    if not enabled:
        if bat.exists():
            bat.unlink()
        if vbs.exists():
            vbs.unlink()
        return
    if frozen():
        if bat.exists():
            bat.unlink()
        _write_hidden_exe_launcher(vbs)
        return
    launcher = launcher_bat()
    bat.write_text(
        f'@echo off\r\n"{launcher}"\r\n',
        encoding="utf-8",
    )


def create_start_menu_shortcut() -> None:
    if not sys.platform.startswith("win"):
        return
    start_menu_dir().mkdir(parents=True, exist_ok=True)
    if frozen():
        _write_hidden_exe_launcher(start_menu_dir() / "Mubaddil.vbs")
        old = start_menu_dir() / "Mubaddil.bat"
        if old.exists():
            old.unlink()
        return
    target = start_menu_dir() / "Mubaddil.bat"
    launcher = launcher_bat()
    target.write_text(
        f'@echo off\r\n"{launcher}"\r\n',
        encoding="utf-8",
    )
