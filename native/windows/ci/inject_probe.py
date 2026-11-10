"""CI probe: can this process type into the foreground window with SendInput?"""
import sys
import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from mubaddil import inject  # noqa: E402

mode = sys.argv[1]
time.sleep(0.5)
if mode == "batch":
    inject._send_batch(0, "AB")
elif mode == "batch-del":
    inject._send_batch(1, "CD")
elif mode == "keywise":
    from pynput import keyboard

    inject._replace_keywise(keyboard.Controller(), 0, "EF")
time.sleep(0.5)
print("probe", mode, "done")
