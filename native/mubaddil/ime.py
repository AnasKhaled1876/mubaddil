import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAC_BIN = ROOT / "bin" / "mubaddil-mac"


def _mac_bin() -> Path:
    return MAC_BIN


def ensure_mac_binary() -> Path | None:
    if sys.platform != "darwin":
        return None
    if MAC_BIN.exists():
        return MAC_BIN
    source = ROOT / "macos" / "MubaddilMac.swift"
    if not source.exists():
        return None
    MAC_BIN.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(
        [
            "swiftc",
            "-O",
            "-framework",
            "Carbon",
            "-framework",
            "AppKit",
            "-framework",
            "ApplicationServices",
            str(source),
            "-o",
            str(MAC_BIN),
        ],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stderr, file=sys.stderr)
        return None
    return MAC_BIN


def mac_run(*args: str) -> subprocess.CompletedProcess:
    binary = ensure_mac_binary()
    if binary is None:
        raise RuntimeError("Could not build macOS helper")
    return subprocess.run(
        [str(binary), *args], capture_output=True, text=True, check=False
    )


def prompt_mac_accessibility() -> bool:
    if sys.platform != "darwin":
        return True
    try:
        from ApplicationServices import AXIsProcessTrustedWithOptions
        from ApplicationServices import kAXTrustedCheckOptionPrompt

        options = {kAXTrustedCheckOptionPrompt: True}
        return bool(AXIsProcessTrustedWithOptions(options))
    except Exception:
        result = mac_run("trust")
        return result.returncode == 0


def list_sources() -> list[dict]:
    if sys.platform == "darwin":
        result = mac_run("ime", "list")
        if result.returncode != 0:
            return []
        try:
            return json.loads(result.stdout or "[]")
        except json.JSONDecodeError:
            return []
    if sys.platform.startswith("win"):
        return [
            {"id": "00000409", "name": "English (US)"},
            {"id": "00000401", "name": "Arabic (101)"},
            {"id": "00010401", "name": "Arabic (102)"},
        ]
    return []


def current_lang() -> str | None:
    if sys.platform == "darwin":
        result = mac_run("ime", "get")
        ident = (result.stdout or "").strip().lower()
        if not ident:
            return None
        if "arab" in ident:
            return "ar"
        return "en"
    if sys.platform.startswith("win"):
        import ctypes

        user32 = ctypes.windll.user32
        hwnd = user32.GetForegroundWindow()
        tid = user32.GetWindowThreadProcessId(hwnd, None)
        hkl = user32.GetKeyboardLayout(tid)
        langid = hkl & 0xFFFF
        if langid == 0x0401:
            return "ar"
        return "en"
    return None


def set_lang(target: str, layout_id: str | None = None) -> bool:
    if sys.platform == "darwin":
        prefer = "pc"
        if layout_id == "mac-arabic":
            prefer = "native"
        result = mac_run("ime", "set", target, prefer)
        return result.returncode == 0
    if sys.platform.startswith("win"):
        return _set_windows_lang(target, layout_id)
    return False


def _set_windows_lang(target: str, layout_id: str | None) -> bool:
    import ctypes

    user32 = ctypes.windll.user32
    if target == "ar":
        klid = "00010401" if layout_id == "windows-102" else "00000401"
    else:
        klid = "00000409"
    hkl = user32.LoadKeyboardLayoutW(klid, 0x00000001)
    if not hkl:
        return False
    hwnd = user32.GetForegroundWindow()
    user32.PostMessageW(hwnd, 0x0050, 0, hkl)
    user32.ActivateKeyboardLayout(hkl, 0)
    return True


_hud_handler = None


def set_hud_handler(handler) -> None:
    """Kept for API compatibility; correction HUD/notifications are disabled."""
    global _hud_handler
    _hud_handler = handler


def show_hud(text: str) -> None:
    """No-op: do not show notifications or HUDs on Windows or Mac."""
    return


def focus_token() -> str:
    """Stable-ish id for the current focused control / window."""
    if sys.platform.startswith("win"):
        return _windows_focus_token()
    if sys.platform == "darwin":
        return _mac_focus_token()
    return "default"


def _windows_focus_token() -> str:
    import ctypes
    from ctypes import wintypes

    class RECT(ctypes.Structure):
        _fields_ = [
            ("left", wintypes.LONG),
            ("top", wintypes.LONG),
            ("right", wintypes.LONG),
            ("bottom", wintypes.LONG),
        ]

    class GUITHREADINFO(ctypes.Structure):
        _fields_ = [
            ("cbSize", wintypes.DWORD),
            ("flags", wintypes.DWORD),
            ("hwndActive", wintypes.HWND),
            ("hwndFocus", wintypes.HWND),
            ("hwndCapture", wintypes.HWND),
            ("hwndMenuOwner", wintypes.HWND),
            ("hwndMoveSize", wintypes.HWND),
            ("hwndCaret", wintypes.HWND),
            ("rcCaret", RECT),
        ]

    user32 = ctypes.windll.user32
    info = GUITHREADINFO()
    info.cbSize = ctypes.sizeof(GUITHREADINFO)
    foreground = user32.GetForegroundWindow()
    tid = user32.GetWindowThreadProcessId(foreground, None)
    focus = 0
    if user32.GetGUIThreadInfo(tid, ctypes.byref(info)):
        focus = int(info.hwndFocus or 0) or int(info.hwndCaret or 0)
    return f"win:{int(foreground or 0)}:{focus}"


def _mac_focus_token() -> str:
    try:
        result = mac_run("focus-id")
        token = (result.stdout or "").strip()
        if result.returncode == 0 and token:
            return f"mac:{token}"
    except Exception:
        pass
    return "mac:unknown"


def config_path() -> Path:
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "Mubaddil" / "config.json"
    if sys.platform.startswith("win"):
        base = os.environ.get("APPDATA") or str(Path.home())
        return Path(base) / "Mubaddil" / "config.json"
    return Path.home() / ".config" / "mubaddil" / "config.json"


def detect_layout_id() -> str:
    if sys.platform == "darwin":
        blob = " ".join(
            f"{item.get('id', '')} {item.get('name', '')}" for item in list_sources()
        ).lower()
        if "pc" in blob or "101" in blob:
            return "mac-arabic-pc"
        if "arab" in blob:
            return "mac-arabic"
        return "mac-arabic-pc"
    return "windows-101"


def load_config() -> dict:
    defaults = {
        "enabled": True,
        "layout_id": detect_layout_id(),
        "sensitivity": "balanced",
        "pause_ms": 180,
        "idle_ms": 600,
        "min_length": 3,
        "start_with_windows": True,
    }
    path = config_path()
    if not path.exists():
        return defaults
    try:
        stored = json.loads(path.read_text(encoding="utf-8"))
        merged = {**defaults, **stored}
        if stored.get("pause_ms") == 700:
            merged["pause_ms"] = defaults["pause_ms"]
        if stored.get("idle_ms") == 1100:
            merged["idle_ms"] = defaults["idle_ms"]
        return merged
    except (OSError, json.JSONDecodeError):
        return defaults


def save_config(config: dict) -> None:
    path = config_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, indent=2), encoding="utf-8")
