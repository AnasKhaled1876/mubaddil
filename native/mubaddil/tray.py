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
    watcher.on_fix = lambda fix: ime.save_state(
        {"last_fix": {"before": fix["before"], "after": fix["after"]} if fix else None}
    )
    watcher.start()

    app_icon = {"icon": None}
    stopped = threading.Event()

    def persist() -> None:
        ime.update_config(enabled=config.get("enabled", True))
        if app_icon["icon"]:
            app_icon["icon"].update_menu()

    def set_enabled(icon, item):
        config["enabled"] = not config.get("enabled", True)
        persist()

    def quit_app(icon=None, item=None):
        if stopped.is_set():
            return
        stopped.set()
        watcher.stop()
        _close_settings()
        if app_icon["icon"]:
            app_icon["icon"].stop()

    def open_window(icon=None, item=None):
        _open_settings()

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

    # Windows: this process only runs the keyboard hook and the tray. The
    # settings window is a separate process, so its WebView2/.NET work can never
    # stall the hook callbacks (Windows silently drops a low-level hook whose
    # callback is late, and then nothing gets fixed anywhere).
    from .instance import QUIT_EVENT, launched_at_sign_in, listen_event, listen_for_show_requests

    listen_for_show_requests(_open_settings)
    listen_event(QUIT_EVENT, quit_app)
    threading.Thread(target=_follow_config, args=(config, watcher, app_icon, stopped), daemon=True).start()

    # Start in the tray only for a sign-in launch after the first run; the
    # very first launch always shows the window.
    start_hidden = bool(config.get("window_seen")) and launched_at_sign_in()
    ime.update_config(window_seen=True, layout_id=config.get("layout_id"))
    if not start_hidden:
        _open_settings()
    icon.run()


_settings = {"proc": None}


def _settings_command() -> tuple[list[str], str | None]:
    if getattr(sys, "frozen", False):
        return [sys.executable, "settings"], None
    return [sys.executable, "-m", "mubaddil", "settings"], str(Path(__file__).resolve().parents[1])


def _open_settings() -> None:
    from .instance import UI_SHOW_EVENT, signal_event

    proc = _settings.get("proc")
    if proc is not None and proc.poll() is None:
        signal_event(UI_SHOW_EVENT)
        return
    import subprocess

    cmd, cwd = _settings_command()
    try:
        _settings["proc"] = subprocess.Popen(cmd, cwd=cwd, close_fds=True)
    except OSError as exc:
        from .paths import log_exception

        log_exception(exc)


def _close_settings() -> None:
    proc = _settings.get("proc")
    if proc is not None and proc.poll() is None:
        try:
            proc.terminate()
        except OSError:
            pass


def _follow_config(config: dict, watcher, app_icon: dict, stopped: threading.Event) -> None:
    """Pick up changes the settings window writes to config.json."""
    import time

    path = ime.config_path()
    last = None
    while not stopped.is_set():
        try:
            mtime = path.stat().st_mtime
        except OSError:
            mtime = None
        if mtime != last:
            if last is not None:
                fresh = ime.load_config()
                for key in ("enabled", "layout_id", "sensitivity"):
                    if key in fresh:
                        config[key] = fresh[key]
                watcher.config = config
                if app_icon["icon"]:
                    try:
                        app_icon["icon"].update_menu()
                    except Exception:
                        pass
            last = mtime
        time.sleep(0.4)
