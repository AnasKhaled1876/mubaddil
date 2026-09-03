import threading
import time

from pynput import keyboard

from . import engine, ime

SEPARATOR_CHARS = set(" \t!?()<>")


class Watcher:
    def __init__(self, config: dict):
        self.config = config
        self.buffer: list[str] = []
        self.injecting = False
        self.controller = keyboard.Controller()
        self.listener: keyboard.Listener | None = None
        self._idle: threading.Timer | None = None
        self._pending: threading.Timer | None = None
        self._modifiers = set()
        self.session: dict | None = None
        self.last_fix: dict | None = None
        self.lock = threading.Lock()

    def start(self) -> None:
        self.listener = keyboard.Listener(
            on_press=self.on_press, on_release=self.on_release
        )
        self.listener.start()

    def stop(self) -> None:
        self._cancel_timers()
        if self.listener:
            self.listener.stop()

    def _cancel_timers(self) -> None:
        if self._idle:
            self._idle.cancel()
            self._idle = None
        if self._pending:
            self._pending.cancel()
            self._pending = None

    def _mods_blocking(self) -> bool:
        return bool(
            self._modifiers
            & {
                keyboard.Key.cmd,
                keyboard.Key.cmd_l,
                keyboard.Key.cmd_r,
                keyboard.Key.ctrl,
                keyboard.Key.ctrl_l,
                keyboard.Key.ctrl_r,
            }
        )

    def on_release(self, key) -> None:
        self._modifiers.discard(key)

    def on_press(self, key) -> None:
        if self.injecting:
            return
        if key in {
            keyboard.Key.cmd,
            keyboard.Key.cmd_l,
            keyboard.Key.cmd_r,
            keyboard.Key.ctrl,
            keyboard.Key.ctrl_l,
            keyboard.Key.ctrl_r,
            keyboard.Key.alt,
            keyboard.Key.alt_l,
            keyboard.Key.alt_r,
        }:
            self._modifiers.add(key)
            return

        if self._mods_blocking():
            if self._is_undo(key):
                self.undo()
            self.buffer.clear()
            self._cancel_timers()
            return

        if key == keyboard.Key.esc:
            self.session = None
            self.buffer.clear()
            self._cancel_timers()
            return

        if key == keyboard.Key.backspace:
            if self.buffer:
                self.buffer.pop()
            return

        if key in {keyboard.Key.space, keyboard.Key.tab}:
            word = "".join(self.buffer)
            self.buffer.clear()
            self._schedule(word, had_separator=True)
            return

        ch = getattr(key, "char", None)
        if not ch:
            return
        if ch in SEPARATOR_CHARS:
            word = "".join(self.buffer)
            self.buffer.clear()
            self._schedule(word, had_separator=True)
            return
        self.buffer.append(ch)
        self._schedule_idle()

    def _is_undo(self, key) -> bool:
        ch = getattr(key, "char", None)
        return ch in {"z", "Z"} and bool(
            self._modifiers
            & {
                keyboard.Key.alt,
                keyboard.Key.alt_l,
                keyboard.Key.alt_r,
            }
        )

    def _schedule_idle(self) -> None:
        if self._idle:
            self._idle.cancel()
        delay = self.config.get("idle_ms", 1100) / 1000
        self._idle = threading.Timer(delay, self._idle_fire)
        self._idle.daemon = True
        self._idle.start()

    def _idle_fire(self) -> None:
        with self.lock:
            word = "".join(self.buffer)
        if word:
            self._schedule(word, had_separator=False)

    def _schedule(self, word: str, had_separator: bool) -> None:
        if self._idle:
            self._idle.cancel()
            self._idle = None
        if not self.config.get("enabled", True):
            return
        decision = self._inspect(word)
        if not decision.get("convert"):
            return
        if self._pending:
            self._pending.cancel()
        pause = self.config.get("pause_ms", 180) / 1000
        self._pending = threading.Timer(
            pause, lambda: self._apply(decision, had_separator)
        )
        self._pending.daemon = True
        self._pending.start()

    def _inspect(self, word: str) -> dict:
        layout_id = self.config.get("layout_id") or engine.guess_default_layout()
        if self.session:
            converted = engine.convert(word, layout_id, self.session["direction"])
            if converted != word:
                return {
                    "convert": True,
                    "word": word,
                    "converted": converted,
                    "direction": self.session["direction"],
                    "target_lang": self.session["target_lang"],
                    "reason": "session",
                }
        return engine.should_convert(
            word,
            layout_id,
            {
                "min_length": self.config.get("min_length", 3),
                "sensitivity": self.config.get("sensitivity", "balanced"),
            },
        )

    def _apply(self, decision: dict, had_separator: bool) -> None:
        with self.lock:
            still = "".join(self.buffer)
            if had_separator:
                suffix = still
                delete_count = len(decision["word"]) + 1 + len(suffix)
                typed = decision["converted"] + " " + suffix
                self.buffer = list(suffix)
            else:
                if still != decision["word"]:
                    return
                delete_count = len(decision["word"])
                typed = decision["converted"]
                self.buffer.clear()
        previous = ime.current_lang()
        target = decision.get("target_lang") or (
            "ar" if decision.get("direction") == "en-to-ar" else "en"
        )
        self.injecting = True
        try:
            for _ in range(delete_count):
                self.controller.press(keyboard.Key.backspace)
                self.controller.release(keyboard.Key.backspace)
                time.sleep(0.001)
            self.controller.type(typed)
            switched = ime.set_lang(target, self.config.get("layout_id"))
            self.last_fix = {
                "before": decision["word"],
                "after": typed,
                "previous_lang": previous,
                "target_lang": target,
                "delete_count": len(typed),
            }
            if switched:
                self.session = None
                ime.show_hud(f"اتظبطت → {decision['converted']}")
            else:
                self.session = {
                    "direction": decision.get("direction"),
                    "target_lang": target,
                }
                ime.show_hud(f"اتظبطت → {decision['converted']} — بدّل اللغة يدويًا")
        finally:
            time.sleep(0.05)
            self.injecting = False

    def undo(self) -> None:
        fix = self.last_fix
        if not fix or self.injecting:
            return
        self.injecting = True
        try:
            for _ in range(fix["delete_count"]):
                self.controller.press(keyboard.Key.backspace)
                self.controller.release(keyboard.Key.backspace)
                time.sleep(0.001)
            extra_space = fix["after"].endswith(" ") and not fix["before"].endswith(" ")
            restore = fix["before"] + (" " if extra_space else "")
            self.controller.type(restore)
            if fix.get("previous_lang"):
                ime.set_lang(fix["previous_lang"], self.config.get("layout_id"))
            self.last_fix = None
            self.session = None
        finally:
            time.sleep(0.05)
            self.injecting = False
