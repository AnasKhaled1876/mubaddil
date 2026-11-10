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
    sub.add_parser("settings", help="open the settings window (its own process)")
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
    if command == "settings":
        return _run_settings()
    if command == "run":
        from .instance import acquire_single_instance, signal_running_instance

        if not acquire_single_instance():
            signal_running_instance()
            return 0
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


def _run_settings() -> int:
    from .instance import UI_MUTEX, UI_SHOW_EVENT, acquire_named_mutex, signal_event
    from .paths import log_exception

    if not acquire_named_mutex(UI_MUTEX):
        signal_event(UI_SHOW_EVENT)
        return 0
    try:
        from . import webui

        if webui.available():
            webui.open_settings()
            return 0
    except Exception as exc:
        log_exception(exc)
    try:
        from . import window
        from .instance import QUIT_EVENT

        class _NoWatcher:
            config: dict = {}

        from .instance import listen_event

        listen_event(UI_SHOW_EVENT, window.show)

        window.open_settings(
            ime.load_config(), _NoWatcher(), on_quit=lambda: signal_event(QUIT_EVENT)
        )
    except Exception as exc:
        log_exception(exc)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
