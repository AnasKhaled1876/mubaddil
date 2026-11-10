"""Modern settings window: HTML/CSS in a WebView2 window (pywebview).

Arabic shaping and mixed Arabic/English text render correctly here, unlike Tk.
If WebView2 or pywebview is missing, tray.py falls back to the Tk window.
"""

from __future__ import annotations

import os
import sys
import threading

from . import engine, ime, startup
from .paths import bundle_dir, is_msix

SESSION: dict = {"window": None, "quitting": False}


def _ui_dir():
    for root in (bundle_dir() / "mubaddil" / "ui", bundle_dir() / "ui"):
        if (root / "index.html").exists():
            return root
    from pathlib import Path

    return Path(__file__).resolve().parent / "ui"


def _system_lang() -> str:
    if sys.platform.startswith("win"):
        try:
            import ctypes

            return "ar" if (ctypes.windll.kernel32.GetUserDefaultUILanguage() & 0x3FF) == 0x01 else "en"
        except Exception:
            return "ar"
    return "ar"


def _dark_mode() -> bool:
    if not sys.platform.startswith("win"):
        return False
    try:
        import winreg

        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize",
        ) as key:
            return winreg.QueryValueEx(key, "AppsUseLightTheme")[0] == 0
    except OSError:
        return False


class Api:
    """Runs in the separate settings process; talks to the main process via files/events."""

    def get_state(self) -> dict:
        c = ime.load_config()
        layouts = [
            {"id": l["id"], "label": l["label"], "label_ar": l["label_ar"]}
            for l in engine.LAYOUTS.values()
            if l.get("device") == ("mac" if sys.platform == "darwin" else "windows")
        ]
        fix = ime.load_state().get("last_fix")
        return {
            "enabled": bool(c.get("enabled", True)),
            "lang": c.get("ui_lang") or _system_lang(),
            "layout_id": c.get("layout_id") or "windows-101",
            "sensitivity": c.get("sensitivity", "balanced"),
            "start_with_windows": bool(c.get("start_with_windows", True)),
            "msix": is_msix(),
            "layouts": layouts,
            "last_fix": fix if isinstance(fix, dict) and fix.get("before") else None,
        }

    def set_enabled(self, value) -> dict:
        ime.update_config(enabled=bool(value))
        return self.get_state()

    def set_layout(self, value) -> dict:
        if value in engine.LAYOUTS:
            ime.update_config(layout_id=value)
        return self.get_state()

    def set_sensitivity(self, value) -> dict:
        if value in {"conservative", "balanced", "aggressive"}:
            ime.update_config(sensitivity=value)
        return self.get_state()

    def set_lang(self, value) -> dict:
        if value in {"ar", "en"}:
            ime.update_config(ui_lang=value)
            window = SESSION.get("window")
            if window:
                window.set_title("مُبَدِل — Mubaddil" if value == "ar" else "Mubaddil — مُبَدِل")
        return self.get_state()

    def set_startup(self, value) -> dict:
        ime.update_config(start_with_windows=bool(value))
        if not is_msix():
            startup.set_enabled(bool(value))
        return self.get_state()

    def open_startup_settings(self) -> None:
        if sys.platform.startswith("win"):
            os.startfile("ms-settings:startupapps")

    def hide(self) -> None:
        threading.Thread(target=close, daemon=True).start()

    def quit(self) -> None:
        from .instance import QUIT_EVENT, signal_event

        signal_event(QUIT_EVENT)
        threading.Thread(target=close, daemon=True).start()


def show() -> None:
    window = SESSION.get("window")
    if window is None:
        return
    try:
        window.show()
        window.restore()
        window.on_top = True
        window.on_top = False
    except Exception:
        return


def close() -> None:
    window = SESSION.get("window")
    if window is None:
        return
    try:
        window.destroy()
    except Exception:
        return


_WEBVIEW2_CLIENT = r"Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}"


def _webview2_installed() -> bool:
    if not sys.platform.startswith("win"):
        return True
    import winreg

    for hive, path in (
        (winreg.HKEY_LOCAL_MACHINE, "SOFTWARE\\WOW6432Node\\" + _WEBVIEW2_CLIENT),
        (winreg.HKEY_LOCAL_MACHINE, "SOFTWARE\\" + _WEBVIEW2_CLIENT),
        (winreg.HKEY_CURRENT_USER, "Software\\" + _WEBVIEW2_CLIENT),
    ):
        try:
            with winreg.OpenKey(hive, path) as key:
                version = winreg.QueryValueEx(key, "pv")[0]
                if version and version != "0.0.0.0":
                    return True
        except OSError:
            continue
    return False


def available() -> bool:
    """True when pywebview imports and the Edge WebView2 runtime is installed."""
    try:
        import webview  # noqa: F401
    except Exception:
        return False
    try:
        return _webview2_installed()
    except Exception:
        return False


def open_settings() -> None:
    """Settings process entry: blocks until the window closes."""
    import webview

    from .instance import UI_SHOW_EVENT, listen_event

    config = ime.load_config()
    lang = config.get("ui_lang") or _system_lang()
    dark = _dark_mode()
    window = webview.create_window(
        "مُبَدِل — Mubaddil" if lang == "ar" else "Mubaddil — مُبَدِل",
        url=str(_ui_dir() / "index.html"),
        js_api=Api(),
        width=500,
        height=780,
        min_size=(440, 600),
        background_color="#121313" if dark else "#f4f4f2",
        text_select=True,
    )
    SESSION["window"] = window
    listen_event(UI_SHOW_EVENT, show)
    gui = "edgechromium" if sys.platform.startswith("win") else None
    webview.start(gui=gui, private_mode=True)
    SESSION["window"] = None
