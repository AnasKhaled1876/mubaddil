#!/usr/bin/env python3
"""Merge English word lists for Arabic-layout → English detection."""

from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "native" / "mubaddil" / "data"
EXT = ROOT / "extension" / "engine" / "dictionaries.js"
SOURCE_DIR = Path("/tmp/en-dicts")

WORD_RE = re.compile(r"^[a-z]+$")

OFFICE_AND_CHAT = """
hello hi hey thanks thank please yes okay ok good morning evening welcome sorry
dear regards attached attachment report meeting tomorrow today yesterday update
updated follow followup regarding confirmed confirm please find kindly noted
done pending review approve approved deadline invoice project weekly monthly
sales figures manager team lead outlook slack teams whatsapp chrome email mail
subject reply forwarded cc bcc inbox calendar schedule appointment call zoom
teams message chat send sent received receive open opened close closed next
previous attachedfile document spreadsheet presentation excel word powerpoint
file files folder drive share shared link url click here below above thanks
please confirm availability tomorrow morning afternoon evening night weekend
monday tuesday wednesday thursday friday saturday sunday january february march
april june july august september october november december
okey okayy thx thanx pls plz thanks alot thanksyou
hello helloo heyya
best regards kind regards many thanks thank you
okay noted understood copy roger will do onit asap fyi btw imo
update status progress blocker issue bug fix fixed ready review comments
attached the report the file the sheet the deck the slides
hello there hi there hey there good morning good evening good afternoon
please review please confirm please check please advise please find
meeting notes meeting invite meeting room
tomorrow morning tomorrow afternoon
sales report weekly report monthly report
""".split()

SEED_KEEP_FIRST = """
hello hi hey thanks thank please yes okay ok good morning evening welcome sorry
the of and to in for is on that by this with you it not or
""".split()


def parse_frequency_file(path: Path) -> list[str]:
    words: list[str] = []
    if not path.is_file():
        return words
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        token = line.strip().split()[0] if line.strip() else ""
        token = token.lower()
        if WORD_RE.match(token):
            words.append(token)
    return words


def parse_plain_file(path: Path, *, english_only: bool = True) -> list[str]:
    words: list[str] = []
    if not path.is_file():
        return words
    for line in path.read_text(encoding="utf-8", errors="ignore").splitlines():
        token = line.strip().replace("\r", "")
        if not token or token.startswith("#"):
            continue
        if english_only:
            token = token.lower()
            if not WORD_RE.match(token):
                continue
        words.append(token)
    return words


def merge(*groups: list[str], english_only: bool = False) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for group in groups:
        for word in group:
            if not word or word in seen:
                continue
            if english_only and not WORD_RE.match(word):
                continue
            seen.add(word)
            out.append(word)
    return out


def write_dictionaries_js(arabic: list[str], english: list[str]) -> None:
    header = """(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  // Built from FrequencyWords (ar + en), Egyptian HF datasets, Arabic names,
  // google-10000-english, and common English first names.
  // See native/mubaddil/data/SOURCES.txt
"""
    footer = """
  KeyboardFix.ARABIC_WORDS = new Set(ARABIC_LIST);
  KeyboardFix.ENGLISH_WORDS = new Set(ENGLISH_LIST);
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
"""
    body = (
        header
        + "  const ARABIC_LIST = "
        + json.dumps(arabic, ensure_ascii=False)
        + ";\n"
        + "  const ENGLISH_LIST = "
        + json.dumps(english, ensure_ascii=False)
        + ";\n"
        + footer
    )
    EXT.write_text(body, encoding="utf-8")


def main() -> None:
    existing = parse_plain_file(DATA / "english_words.txt", english_only=True)
    arabic = parse_plain_file(DATA / "arabic_words.txt", english_only=False)
    names_ar = []
    names_path = DATA / "arabic_names.txt"
    if names_path.is_file():
        for line in names_path.read_text(encoding="utf-8").splitlines():
            names_ar.extend(part.strip() for part in line.split() if part.strip())

    freq = parse_frequency_file(SOURCE_DIR / "en_50k.txt")
    g1 = parse_plain_file(SOURCE_DIR / "google-10000-english.txt")
    g2 = parse_plain_file(SOURCE_DIR / "google-10000-english-usa.txt")
    g3 = parse_plain_file(SOURCE_DIR / "google-10000-english-no-swears.txt")
    first_names = parse_plain_file(SOURCE_DIR / "first-names.txt")

    english = merge(
        [w.lower() for w in SEED_KEEP_FIRST],
        existing,
        [w.lower() for w in OFFICE_AND_CHAT],
        g1,
        g2,
        g3,
        freq,
        first_names,
        english_only=True,
    )
    arabic_all = merge(arabic, names_ar)

    DATA.joinpath("english_words.txt").write_text("\n".join(english) + "\n", encoding="utf-8")
    write_dictionaries_js(arabic_all, english)
    print(f"english words: {len(english)}")
    print(f"arabic words in js: {len(merge(arabic, names_ar))}")
    print(f"wrote {DATA / 'english_words.txt'}")
    print(f"wrote {EXT}")


if __name__ == "__main__":
    main()
