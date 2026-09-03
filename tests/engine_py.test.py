import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "native"))

from mubaddil import engine


def assert_eq(name, actual, expected):
    if actual != expected:
        raise SystemExit(f"{name}: expected {expected!r}, got {actual!r}")


assert_eq("سلام from english", engine.convert("hgsghl", "windows-101"), "السلام")
assert_eq("عليكم from english", engine.convert("ugd;l", "windows-101"), "عليكم")
assert_eq("مرحبا from english", engine.convert("lvpfh", "windows-101"), "مرحبا")
assert_eq("hello from arabic", engine.convert("اثممخ", "windows-101"), "hello")

greeting = engine.should_convert("hgsghl", "windows-101")
assert_eq("detect السلام", greeting["convert"] and greeting["converted"] == "السلام", True)

alaykum = engine.should_convert("ugd;l", "windows-101")
assert_eq("detect عليكم", alaykum["convert"] and alaykum["converted"] == "عليكم", True)

hello = engine.should_convert("hello", "windows-101")
assert_eq("do not convert hello", hello["convert"], False)

salaam = engine.should_convert("السلام", "windows-101")
assert_eq("do not convert real arabic", salaam["convert"], False)

assert_eq("mac z is ظ", engine.convert("z", "mac-arabic"), "ظ")
assert_eq("windows z is ئ", engine.convert("z", "windows-101"), "ئ")

print("python engine tests passed")
