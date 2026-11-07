"""Replace text in the focused field.

On Windows every backspace and character goes out in ONE SendInput call, so
the edit lands atomically and cannot be interleaved with other input or
partly dropped. Other platforms use pynput key by key.
"""

from __future__ import annotations

import sys
import time

if sys.platform.startswith("win"):
    import ctypes
    from ctypes import wintypes

    _ULONG_PTR = ctypes.c_size_t
    _INPUT_KEYBOARD = 1
    _KEYEVENTF_KEYUP = 0x0002
    _KEYEVENTF_UNICODE = 0x0004
    _VK_BACK = 0x08

    class _KEYBDINPUT(ctypes.Structure):
        _fields_ = [
            ("wVk", wintypes.WORD),
            ("wScan", wintypes.WORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", _ULONG_PTR),
        ]

    class _MOUSEINPUT(ctypes.Structure):
        _fields_ = [
            ("dx", wintypes.LONG),
            ("dy", wintypes.LONG),
            ("mouseData", wintypes.DWORD),
            ("dwFlags", wintypes.DWORD),
            ("time", wintypes.DWORD),
            ("dwExtraInfo", _ULONG_PTR),
        ]

    class _HARDWAREINPUT(ctypes.Structure):
        _fields_ = [
            ("uMsg", wintypes.DWORD),
            ("wParamL", wintypes.WORD),
            ("wParamH", wintypes.WORD),
        ]

    class _INPUTUNION(ctypes.Union):
        _fields_ = [("ki", _KEYBDINPUT), ("mi", _MOUSEINPUT), ("hi", _HARDWAREINPUT)]

    class _INPUT(ctypes.Structure):
        _anonymous_ = ("u",)
        _fields_ = [("type", wintypes.DWORD), ("u", _INPUTUNION)]

    _user32 = ctypes.WinDLL("user32", use_last_error=True)
    _user32.SendInput.argtypes = (wintypes.UINT, ctypes.POINTER(_INPUT), ctypes.c_int)
    _user32.SendInput.restype = wintypes.UINT

    def _key(vk: int = 0, scan: int = 0, flags: int = 0) -> "_INPUT":
        item = _INPUT()
        item.type = _INPUT_KEYBOARD
        item.ki = _KEYBDINPUT(vk, scan, flags, 0, 0)
        return item

    def build_events(delete_count: int, text: str) -> list:
        events = []
        for _ in range(delete_count):
            events.append(_key(vk=_VK_BACK))
            events.append(_key(vk=_VK_BACK, flags=_KEYEVENTF_KEYUP))
        data = text.encode("utf-16-le")
        for i in range(0, len(data), 2):
            unit = int.from_bytes(data[i : i + 2], "little")
            events.append(_key(scan=unit, flags=_KEYEVENTF_UNICODE))
            events.append(_key(scan=unit, flags=_KEYEVENTF_UNICODE | _KEYEVENTF_KEYUP))
        return events

    def replace(controller, delete_count: int, text: str) -> None:
        events = build_events(delete_count, text)
        if not events:
            return
        array = (_INPUT * len(events))(*events)
        sent = _user32.SendInput(len(events), array, ctypes.sizeof(_INPUT))
        if sent != len(events):
            raise OSError(ctypes.get_last_error(), "SendInput was blocked")

else:

    def replace(controller, delete_count: int, text: str) -> None:
        from pynput import keyboard

        for _ in range(delete_count):
            controller.press(keyboard.Key.backspace)
            controller.release(keyboard.Key.backspace)
            time.sleep(0.001)
        controller.type(text)
