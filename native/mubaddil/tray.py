import sys
from pathlib import Path

import pystray
from PIL import Image

from . import engine, ime, startup
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

    def set_layout(layout_id: str):
        def _inner(icon, item):
            config["layout_id"] = layout_id
            persist()

        return _inner

    def set_sensitivity(level: str):
        def _inner(icon, item):
            config["sensitivity"] = level
            persist()

        return _inner

    def quit_app(icon=None, item=None):
        watcher.stop()
        if app_icon["icon"]:
            app_icon["icon"].stop()

    def open_window(icon=None, item=None):
        try:
            from .window import show

            show()
        except Exception:
            return

    def layout_menu():
        items = []
        for layout in engine.LAYOUTS.values():
            items.append(
                pystray.MenuItem(
                    f"{layout['label_ar']} / {layout['label']}",
                    set_layout(layout["id"]),
                    checked=lambda item, lid=layout["id"]: config.get("layout_id")
                    == lid,
                    radio=True,
                )
            )
        return pystray.Menu(*items)

    menu = pystray.Menu(
        pystray.MenuItem("فتح مبدّل", open_window, default=True),
        pystray.MenuItem(
            "شغّال",
            set_enabled,
            checked=lambda item: config.get("enabled", True),
        ),
        pystray.MenuItem("التخطيط", layout_menu),
        pystray.MenuItem(
            "حساسية هادية",
            set_sensitivity("conservative"),
            checked=lambda item: config.get("sensitivity") == "conservative",
            radio=True,
        ),
        pystray.MenuItem(
            "حساسية متوازنة",
            set_sensitivity("balanced"),
            checked=lambda item: config.get("sensitivity") == "balanced",
            radio=True,
        ),
        pystray.MenuItem(
            "حساسية سريعة",
            set_sensitivity("aggressive"),
            checked=lambda item: config.get("sensitivity") == "aggressive",
            radio=True,
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

    try:
        from . import window as _window  # noqa: F401

        has_window = True
    except Exception:
        has_window = False

    if has_window:
        icon.run_detached()
        try:
            from .window import open_settings

            open_settings(config, watcher, on_quit=quit_app)
        except Exception:
            icon.run()
    else:
        icon.run()
