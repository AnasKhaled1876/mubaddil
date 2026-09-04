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

hello_ar = engine.should_convert("اثممخ", "windows-101")
assert_eq("detect hello", hello_ar["convert"] and hello_ar["converted"] == "hello", True)

hello = engine.should_convert("hello", "windows-101")
assert_eq("do not convert hello", hello["convert"], False)

salaam = engine.should_convert("السلام", "windows-101")
assert_eq("do not convert real arabic", salaam["convert"], False)

noise = engine.should_convert("qwerty", "windows-101")
assert_eq("reject non-dictionary latin", noise["convert"], False)

opening = engine.should_convert_opening(["hgsghl", "ugd;l"], "windows-101")
assert_eq(
    "opening phrase",
    opening["convert"] and opening["converted"] == "السلام عليكم",
    True,
)

opening_en = engine.should_convert_opening(["اثممخ"], "windows-101")
assert_eq(
    "opening english",
    opening_en["convert"] and opening_en["converted"] == "hello",
    True,
)

assert_eq("mac z is ظ", engine.convert("z", "mac-arabic"), "ظ")
assert_eq("windows z is ئ", engine.convert("z", "windows-101"), "ئ")

assert_eq("arabic dictionary loaded", len(engine.ARABIC_WORD_SET) > 5000, True)
assert_eq("english dictionary loaded", len(engine.ENGLISH_WORD_SET) > 5000, True)
assert_eq("freq word في present", "في" in engine.ARABIC_WORD_SET, True)
assert_eq("freq word please present", "please" in engine.ENGLISH_WORD_SET, True)

# A common Arabic word from FrequencyWords should convert from wrong Latin keys
# when remapped form is in the dictionary (e.g. من from ug on windows-101: u->ع g->ل — not من).
# Spot-check that dictionary-backed detection still works for greetings after expand.
assert_eq(
    "expanded dict still detects السلام",
    engine.should_convert("hgsghl", "windows-101")["convert"],
    True,
)

print("python engine tests passed")
