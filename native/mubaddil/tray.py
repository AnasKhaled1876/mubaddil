import sys
from pathlib import Path

import pystray
from PIL import Image

from . import ime, startup
from .hook import Watcher
from .paths import bundle_dir, is_msix


ICON_CANDIDATES = [
    bundle_dir() / "assets" / "icon.png",
    Path(__file__).resolve().parents[1] / "assets" / "icon.png",
    Path(__file__).resolve().parents[2] / "extension" / "icons" / "icon128.png",
]


def _load_icon() -> Image.Image:
    for path in ICON_CANDIDATES:
        if path.exists():
            return Image.open(path)
    return Image.new("RGB", (64, 64), (31, 107, 74))


def run_tray() -> None:
    config = ime.load_config()
    if "start_with_windows" not in config:
        config["start_with_windows"] = sys.platform.startswith("win")
    config["layout_id"] = ime.detect_layout_id()
    watcher = Watcher(config)
    watcher.start()

    app_icon = {"icon": None}

    def persist() -> None:
        ime.save_config(config)
        if app_icon["icon"]:
            app_icon["icon"].update_menu()

    def set_enabled(icon, item):
        config["enabled"] = not config.get("enabled", True)
        persist()

    def quit_app(icon=None, item=None):
        watcher.stop()
        if app_icon["icon"]:
            app_icon["icon"].stop()

    menu = pystray.Menu(
        pystray.MenuItem(
            "شغّال",
            set_enabled,
            checked=lambda item: config.get("enabled", True),
        ),
        pystray.MenuItem("خروج", quit_app),
    )

    icon = pystray.Icon("mubaddil", _load_icon(), "مبدّل", menu)
    app_icon["icon"] = icon

    if (
        sys.platform.startswith("win")
        and config.get("start_with_windows", True)
        and not is_msix()
    ):
        startup.set_enabled(True)
        startup.create_start_menu_shortcut()

    icon.run()
