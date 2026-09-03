"""PyInstaller entry. Keep the mubaddil package on sys.path, then start it."""

import sys
from pathlib import Path

if getattr(sys, "frozen", False):
    bundle = getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent)
    sys.path.insert(0, str(bundle))
    sys.path.insert(0, str(Path(sys.executable).resolve().parent))
else:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from mubaddil.__main__ import main

if __name__ == "__main__":
    raise SystemExit(main())
