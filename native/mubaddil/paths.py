import os
import sys
from pathlib import Path


def frozen() -> bool:
    return bool(getattr(sys, "frozen", False))


def bundle_dir() -> Path:
    if frozen():
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).parent))
    return Path(__file__).resolve().parents[1]


def is_msix() -> bool:
    if os.environ.get("PACKAGE_FAMILY_NAME"):
        return True
    return "WindowsApps" in str(Path(sys.executable))
