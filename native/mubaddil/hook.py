import os
import threading
import time

from pynput import keyboard, mouse

from . import engine, ime, inject

SEPARATOR_CHARS = set(" \t!?()<>")
MAX_OPENING_WORDS = 2
# Shortest word each sensitivity level will convert.
SENSITIVITY_MIN_LENGTH = {"conservative": 4, "balanced": 3, "aggressive": 2}


_DEBUG = bool(os.environ.get("MUBADDIL_DEBUG"))


def _trace(*parts) -> None:
    if not _DEBUG:
        return
    try:
        from .paths import log_file

        with open(log_file().with_name("debug.log"), "a", encoding="utf-8") as fh:
            fh.write(f"{time.time():.3f} " + " ".join(str(p) for p in parts) + "\n")
    except OSError:
        pass


class Watcher:
    def __init__(self, config: dict):
        self.config = config
        self.buffer: list[str] = []
        self.opening_words: list[str] = []
        self.injecting = False
        self.controller = keyboard.Controller()
        self.listener: keyboard.Listener | None = None
        self.mouse: mouse.Listener | None = None
        self._idle: threading.Timer | None = None
        self._pending: threading.Timer | None = None
        self._modifiers = set()
        self._held = set()
        self.last_fix: dict | None = None
        self.lock = threading.Lock()
        self.armed_focus: str | None = None
        self.field_done = False
        self.opening_had_separator = False

    def start(self) -> None:
        self.listener = keyboard.Listener(
            on_press=self.on_press, on_release=self.on_release
        )
        self.mouse = mouse.Listener(on_click=self.on_click)
        self.listener.start()
        self.mouse.start()

    def stop(self) -> None:
        self._cancel_timers()
        if self.listener:
            self.listener.stop()
        if self.mouse:
            self.mouse.stop()

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
        self._held.discard(key)

    def _rearm_field(self) -> None:
        _trace("rearm")
        self.armed_focus = ime.focus_token()
        self.field_done = False
        self.opening_words = []
        self.opening_had_separator = False
        self.buffer.clear()
        self._cancel_timers()

    def _refresh_field(self) -> None:
        token = ime.focus_token()
        if token != self.armed_focus:
            self._rearm_field()

    def on_click(self, x, y, button, pressed) -> None:
        if self.injecting or not pressed:
            return
        # Chrome/WhatsApp keep one HWND for many boxes; a click is a new field.
        self._rearm_field()

    def _mark_field_done(self) -> None:
        self.field_done = True
        self.opening_words = []
        self.opening_had_separator = False
        self.buffer.clear()
        self._cancel_timers()

    def on_press(self, key) -> None:
        _trace("press", repr(key), "injecting" if self.injecting else "", "done" if self.field_done else "", "buf=" + "".join(self.buffer))
        if self.injecting:
            return
        self._held.add(key)
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

        if self._is_undo(key):
            self.undo()
            return

        self._refresh_field()

        if key == keyboard.Key.tab:
            self._rearm_field()
            return

        if self._mods_blocking():
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
            if ch or key == keyboard.Key.space:
                return
            return

        if key == keyboard.Key.backspace:
            if self.buffer:
                self.buffer.pop()
            return

        if key == keyboard.Key.space:
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

    def _is_undo(self, key) -> bool:
        ch = getattr(key, "char", None)
        is_z = ch in {"z", "Z"} or getattr(key, "vk", None) == 0x5A
        return is_z and bool(
            self._modifiers
            & {
                keyboard.Key.alt,
                keyboard.Key.alt_l,
                keyboard.Key.alt_r,
            }
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
        self._evaluate_opening(
            had_separator=self.opening_had_separator,
            wait_for_more=len(self.opening_words) < MAX_OPENING_WORDS,
        )

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
                "min_length": SENSITIVITY_MIN_LENGTH.get(
                    self.config.get("sensitivity", "balanced"),
                    self.config.get("min_length", 3),
                ),
            },
        )
        _trace("decision", words, layout_id, decision)
        if not decision.get("convert"):
            if wait_for_more:
                return
            self._mark_field_done()
            return
        # Apply on the next tick so Space finishes, with no user-visible pause.
        self._pending = threading.Timer(0, lambda: self._apply(decision, had_separator))
        self._pending.daemon = True
        self._pending.start()

    def _apply(self, decision: dict, had_separator: bool) -> None:
        try:
            self._apply_inner(decision, had_separator)
        except Exception as exc:
            from .paths import log_exception

            log_exception(exc)

    def _wait_for_keys_up(self, timeout: float = 0.4) -> None:
        """Windows drops input we inject while the trigger key is still down."""
        deadline = time.time() + timeout
        while time.time() < deadline:
            held = {k for k in self._held if k not in self._modifiers}
            if not held:
                break
            time.sleep(0.01)
        time.sleep(0.03)

    def _apply_inner(self, decision: dict, had_separator: bool) -> None:
        self._wait_for_keys_up()
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
            inject.replace(self.controller, delete_count, typed)
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
            # Let our own injected keys drain through the hook before listening again.
            time.sleep(0.25)
            self.injecting = False

    def undo(self) -> None:
        fix = self.last_fix
        if not fix or self.injecting:
            return
        threading.Thread(target=self._undo_after_release, args=(fix,), daemon=True).start()

    def _undo_after_release(self, fix: dict) -> None:
        deadline = time.time() + 1.0
        while self._modifiers and time.time() < deadline:
            time.sleep(0.01)
        self._wait_for_keys_up()
        if self.injecting or self.last_fix is not fix:
            return
        self.injecting = True
        try:
            extra_space = fix["after"].endswith(" ") and not fix["before"].endswith(" ")
            restore = fix["before"] + (" " if extra_space else "")
            inject.replace(self.controller, fix["delete_count"], restore)
            if fix.get("previous_lang"):
                ime.set_lang(fix["previous_lang"], self.config.get("layout_id"))
            self.last_fix = None
            self.field_done = True
        finally:
            # Let our own injected keys drain through the hook before listening again.
            time.sleep(0.25)
            self.injecting = False
