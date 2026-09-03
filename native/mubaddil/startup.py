import os
import sys
from pathlib import Path


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
    return (startup_dir() / "Mubaddil.bat").exists()


def set_enabled(enabled: bool) -> None:
    if not sys.platform.startswith("win"):
        return
    from .paths import is_msix

    if is_msix():
        return
    target = startup_dir() / "Mubaddil.bat"
    startup_dir().mkdir(parents=True, exist_ok=True)
    if not enabled:
        if target.exists():
            target.unlink()
        return
    launcher = launcher_bat()
    target.write_text(
        f'@echo off\r\n"{launcher}"\r\n',
        encoding="utf-8",
    )


def create_start_menu_shortcut() -> None:
    if not sys.platform.startswith("win"):
        return
    start_menu_dir().mkdir(parents=True, exist_ok=True)
    target = start_menu_dir() / "Mubaddil.bat"
    launcher = launcher_bat()
    target.write_text(
        f'@echo off\r\n"{launcher}"\r\n',
        encoding="utf-8",
    )
