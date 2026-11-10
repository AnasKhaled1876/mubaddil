import os
import sys
import threading
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
    from . import engine
    from .hook import _trace

    _trace(
        "startup",
        "exe=" + sys.executable,
        "msix=" + str(is_msix()),
        "layout=" + str(config.get("layout_id")),
        "enabled=" + str(config.get("enabled", True)),
        "config=" + str(ime.config_path()),
        "hkls=" + ",".join(f"{h & 0xFFFFFFFF:08x}" for h in ime._windows_installed_hkls())
        if sys.platform.startswith("win")
        else "",
    )
    _trace("dict sizes", {k: len(v) for k, v in vars(engine).items() if isinstance(v, (set, frozenset)) and len(v) > 100})
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

    ui = {"module": None}

    def quit_app(icon=None, item=None):
        watcher.stop()
        if app_icon["icon"]:
            app_icon["icon"].stop()
        if ui["module"] is not None:
            ui["module"].close()

    def open_window(icon=None, item=None):
        if ui["module"] is not None:
            ui["module"].show()

    menu = pystray.Menu(
        pystray.MenuItem(
            "الإعدادات — Settings",
            open_window,
            default=True,
            visible=sys.platform.startswith("win"),
        ),
        pystray.MenuItem(
            "شغّال",
            set_enabled,
            checked=lambda item: config.get("enabled", True),
        ),
        pystray.MenuItem("خروج — Quit", quit_app),
    )

    icon = pystray.Icon("mubaddil", _load_icon(), "مُبَدِل — Mubaddil", menu)
    app_icon["icon"] = icon

    if (
        sys.platform.startswith("win")
        and config.get("start_with_windows", True)
        and not is_msix()
    ):
        startup.set_enabled(True)
        startup.create_start_menu_shortcut()

    if not sys.platform.startswith("win"):
        icon.run()
        return

    # Windows: the tray runs on its own thread and the settings window owns the
    # main thread, so launching the app always shows a real window.
    from .instance import launched_at_sign_in, listen_for_show_requests
    from .paths import log_exception

    icon.run_detached()
    # Start in the tray only for a sign-in launch after the first run; the
    # very first launch always shows the window.
    start_hidden = bool(config.get("window_seen")) and launched_at_sign_in()
    config["window_seen"] = True
    ime.save_config(config)
    listen_for_show_requests(lambda: ui["module"] and ui["module"].show())
    try:
        from . import webui

        if os.environ.get("MUBADDIL_TK_UI") or not webui.available():
            raise RuntimeError("WebView2 UI unavailable")
        ui["module"] = webui
        webui.open_settings(config, watcher, on_quit=quit_app, start_hidden=start_hidden)
        return
    except Exception as exc:  # fall back to the classic Tk window
        log_exception(exc)
    try:
        from . import window

        ui["module"] = window
        window.open_settings(
            config,
            watcher,
            on_quit=quit_app,
            start_hidden=start_hidden,
        )
    except Exception as exc:  # Tk missing or broken: keep working from the tray.
        log_exception(exc)
        stopped = threading.Event()
        original_quit = quit_app

        def quit_and_release(icon=None, item=None):
            original_quit(icon, item)
            stopped.set()

        icon.menu = pystray.Menu(
            pystray.MenuItem(
                "شغّال",
                set_enabled,
                checked=lambda item: config.get("enabled", True),
            ),
            pystray.MenuItem("خروج — Quit", quit_and_release),
        )
        stopped.wait()
