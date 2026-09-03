import argparse
import sys
from pathlib import Path

if not __package__:
    sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
    __package__ = "mubaddil"

from . import engine, ime


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Mubaddil — system-wide Arabic/English keyboard layout fixer"
    )
    sub = parser.add_subparsers(dest="command")

    convert = sub.add_parser("convert", help="remap a word")
    convert.add_argument("text")
    convert.add_argument("--layout", default=engine.guess_default_layout())

    detect = sub.add_parser("detect", help="score whether a word is the wrong layout")
    detect.add_argument("text")
    detect.add_argument("--layout", default=engine.guess_default_layout())

    sub.add_parser("ime-list", help="list OS keyboard sources")
    sub.add_parser("ime-get", help="show current OS keyboard language")
    set_cmd = sub.add_parser("ime-set", help="switch OS keyboard language")
    set_cmd.add_argument("lang", choices=["ar", "en"])
    set_cmd.add_argument("--layout", default=engine.guess_default_layout())

    sub.add_parser("run", help="start the system tray watcher (default)")
    args = parser.parse_args()
    command = args.command or "run"

    if command == "convert":
        print(engine.convert(args.text, args.layout))
        return 0
    if command == "detect":
        print(engine.should_convert(args.text, args.layout))
        return 0
    if command == "ime-list":
        for source in ime.list_sources():
            print(f"{source.get('id', '')}\t{source.get('name', '')}")
        return 0
    if command == "ime-get":
        print(ime.current_lang() or "unknown")
        return 0
    if command == "ime-set":
        ok = ime.set_lang(args.lang, args.layout)
        print("ok" if ok else "failed")
        return 0 if ok else 1
    if command == "run":
        if sys.platform == "darwin" and not ime.prompt_mac_accessibility():
            print(
                "Allow Mubaddil in System Settings → Privacy & Security → Accessibility, then run again.",
                file=sys.stderr,
            )
            return 1
        from .tray import run_tray

        run_tray()
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
