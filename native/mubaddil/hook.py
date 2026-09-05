import threading
import time

from pynput import keyboard

from . import engine, ime

SEPARATOR_CHARS = set(" \t!?()<>")
MAX_OPENING_WORDS = 2


class Watcher:
    def __init__(self, config: dict):
        self.config = config
        self.buffer: list[str] = []
        self.opening_words: list[str] = []
        self.injecting = False
        self.controller = keyboard.Controller()
        self.listener: keyboard.Listener | None = None
        self._idle: threading.Timer | None = None
        self._pending: threading.Timer | None = None
        self._modifiers = set()
        self.last_fix: dict | None = None
        self.lock = threading.Lock()
        self.armed_focus: str | None = None
        self.field_done = False
        self.opening_had_separator = False

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

    def _refresh_field(self) -> None:
        token = ime.focus_token()
        if token != self.armed_focus:
            self.armed_focus = token
            self.field_done = False
            self.opening_words = []
            self.opening_had_separator = False
            self.buffer.clear()
            self._cancel_timers()

    def _mark_field_done(self) -> None:
        self.field_done = True
        self.opening_words = []
        self.opening_had_separator = False
        self.buffer.clear()
        self._cancel_timers()

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

        self._refresh_field()

        if self._mods_blocking():
            if self._is_undo(key):
                self.undo()
            self.buffer.clear()
            self._cancel_timers()
            return

        if key == keyboard.Key.esc:
            self.buffer.clear()
            self.opening_words = []
            self.opening_had_separator = False
            self._cancel_timers()
            return

        if self.field_done:
            if key == keyboard.Key.backspace:
                return
            ch = getattr(key, "char", None)
            if ch or key in {keyboard.Key.space, keyboard.Key.tab}:
                return
            return

        if key == keyboard.Key.backspace:
            if self.buffer:
                self.buffer.pop()
            return

        if key in {keyboard.Key.space, keyboard.Key.tab}:
            word = "".join(self.buffer)
            self.buffer.clear()
            self._complete_word(word, had_separator=True)
            return

        ch = getattr(key, "char", None)
        if not ch:
            return
        if ch in SEPARATOR_CHARS:
            word = "".join(self.buffer)
            self.buffer.clear()
            self._complete_word(word, had_separator=True)
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
        delay = self.config.get("idle_ms", 600) / 1000
        self._idle = threading.Timer(delay, self._idle_fire)
        self._idle.daemon = True
        self._idle.start()

    def _idle_fire(self) -> None:
        with self.lock:
            if self.field_done:
                return
            word = "".join(self.buffer)
            opening = list(self.opening_words)
        if word:
            # Idle mid-word: treat buffer as next opening word without separator.
            self._complete_word(word, had_separator=False, clear_buffer=True)
            return
        if opening:
            self._evaluate_opening(
                had_separator=self.opening_had_separator,
                wait_for_more=len(opening) < MAX_OPENING_WORDS,
            )

    def _complete_word(
        self, word: str, had_separator: bool, clear_buffer: bool = False
    ) -> None:
        if clear_buffer:
            self.buffer.clear()
        if self._idle:
            self._idle.cancel()
            self._idle = None
        if not self.config.get("enabled", True):
            return
        if self.field_done:
            return
        if word.strip():
            if len(self.opening_words) >= MAX_OPENING_WORDS:
                self._mark_field_done()
                return
            self.opening_words.append(word.strip())
            self.opening_had_separator = had_separator
        if not self.opening_words:
            return
        if len(self.opening_words) >= MAX_OPENING_WORDS:
            self._evaluate_opening(
                had_separator=self.opening_had_separator, wait_for_more=False
            )
            return
        # Wait for more opening words, or idle to decide.
        self._schedule_idle()

    def _evaluate_opening(self, had_separator: bool, wait_for_more: bool = False) -> None:
        if self._pending:
            self._pending.cancel()
            self._pending = None
        words = list(self.opening_words)
        if not words:
            return
        layout_id = self.config.get("layout_id") or engine.guess_default_layout()
        decision = engine.should_convert_opening(
            words,
            layout_id,
            {
                "min_length": self.config.get("min_length", 3),
            },
        )
        if not decision.get("convert"):
            if wait_for_more:
                return
            self._mark_field_done()
            return
        pause = self.config.get("pause_ms", 180) / 1000
        self._pending = threading.Timer(
            pause, lambda: self._apply(decision, had_separator)
        )
        self._pending.daemon = True
        self._pending.start()

    def _apply(self, decision: dict, had_separator: bool) -> None:
        with self.lock:
            if self.field_done:
                return
            still = "".join(self.buffer)
            original = decision["word"]
            converted = decision["converted"]
            if had_separator:
                suffix = still
                delete_count = len(original) + 1 + len(suffix)
                typed = converted + " " + suffix
                self.buffer = list(suffix)
            else:
                if still and still != decision["words"][-1]:
                    # User kept typing a different continuation; abort this apply.
                    return
                if still == decision["words"][-1]:
                    delete_count = len(original)
                    typed = converted
                    self.buffer.clear()
                else:
                    delete_count = len(original)
                    typed = converted
                    self.buffer.clear()
            self.opening_words = []
            self.opening_had_separator = False

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
            ime.set_lang(target, self.config.get("layout_id"))
            self.last_fix = {
                "before": original,
                "after": typed,
                "previous_lang": previous,
                "target_lang": target,
                "delete_count": len(typed),
            }
            self.field_done = True
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
            self.field_done = True
        finally:
            time.sleep(0.05)
            self.injecting = False
