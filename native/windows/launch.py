"""PyInstaller entry. Import the package so relative imports in mubaddil work."""

from mubaddil.__main__ import main

if __name__ == "__main__":
    raise SystemExit(main())
