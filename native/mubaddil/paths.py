import os
import sys
from pathlib import Path


def frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def bundle_dir() -> Path:
    if frozen():
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parents[1]


def log_file() -> Path:
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or str(Path.home())
        folder = Path(base) / "Mubaddil"
    else:
        folder = Path.home() / ".local" / "share" / "mubaddil"
    folder.mkdir(parents=True, exist_ok=True)
    return folder / "error.log"


def log_exception(exc: BaseException) -> None:
    import traceback

    try:
        log_file().write_text(
            "".join(traceback.format_exception(type(exc), exc, exc.__traceback__)),
            encoding="utf-8",
        )
    except OSError:
        return


def is_msix() -> bool:
    if os.environ.get("PACKAGE_FAMILY_NAME"):
        return True
    return "WindowsApps" in str(Path(sys.executable))
