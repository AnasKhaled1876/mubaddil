"""Simulate everyday typing: search, chat, names, already-correct text."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "native"))

from mubaddil import engine, ime


def assert_eq(name, actual, expected):
    if actual != expected:
        raise SystemExit(f"{name}: expected {expected!r}, got {actual!r}")


def typed(latin: str) -> dict:
    return engine.should_convert(latin, "windows-101")


# WhatsApp / greeting
assert_eq("whatsapp السلام", typed("hgsghl")["converted"], "السلام")
assert_eq("whatsapp عليكم", typed("ugd;l")["converted"], "عليكم")
greeting = engine.should_convert_opening(["hgsghl", "ugd;l"], "windows-101")
assert_eq("whatsapp opening", greeting.get("converted"), "السلام عليكم")

# Full Arabic name typed on an English layout
assert_eq("name أنس", typed("Hks")["converted"], "أنس")
assert_eq("name انس", typed("hks")["converted"], "انس")
assert_eq("name خالد", typed("ohg]")["converted"], "خالد")
assert_eq("name محمد", typed("lpl]")["converted"], "محمد")
assert_eq("name صابر", typed("whfv")["converted"], "صابر")
full = engine.should_convert_opening(
    ["Hks", "ohg]", "lpl]", "whfv"], "windows-101"
)
assert_eq(
    "full name أنس خالد محمد صابر",
    full.get("convert") and full.get("converted") == "أنس خالد محمد صابر",
    True,
)

# Already-correct Arabic / English must stay put (Google, WhatsApp, replies)
for word in ("hello", "thanks", "please", "google", "the", "and"):
    assert_eq(f"keep english {word}", typed(word)["convert"], False)
for word in ("السلام", "محمد", "خالد", "أنس", "صابر", "ازيك"):
    assert_eq(f"keep arabic {word}", engine.should_convert(word, "windows-101")["convert"], False)

# English typed on Arabic layout
assert_eq("reply hello", typed("اثممخ")["convert"] and typed("اثممخ")["converted"] == "hello", True)

# Search-like noise should not flip
assert_eq("search noise qwerty", typed("qwerty")["convert"], False)
assert_eq("url-ish skip", engine.should_convert("https://x.com", "windows-101")["convert"], False)

# Installed-layout detection: Egyptian / Morocco / Saudi are all Arabic
assert_eq("saudi arabic", ime.is_arabic_langid(0x0401), True)
assert_eq("egypt arabic", ime.is_arabic_langid(0x0C01), True)
assert_eq("morocco arabic", ime.is_arabic_langid(0x0801), True)
assert_eq("us english", ime.is_english_langid(0x0409), True)
assert_eq("uk english", ime.is_english_langid(0x0809), True)
assert_eq("hkl egypt is ar", ime.lang_of_hkl(0x0C01), "ar")
assert_eq("hkl us is en", ime.lang_of_hkl(0x0409), "en")
assert_eq("101 layout", ime.windows_keyboard_layout_id(0x04010401), "windows-101")
assert_eq("102 layout", ime.windows_keyboard_layout_id(0x01040401), "windows-102")

print("user flow tests passed")
