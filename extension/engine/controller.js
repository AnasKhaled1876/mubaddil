(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const DEFAULTS = {
    enabled: true,
    layoutId: null,
    minLength: 3,
    sensitivity: "balanced",
    pauseMs: 700,
    idleMs: 1100,
    sessionRemap: true,
  };

  // Only split on whitespace and marks that are never Arabic letters.
  // ; ' [ ] , . / ` are letter keys on Arabic 101 (ك ط ج د و ز ظ ذ).
  const SEPARATOR = /[\s!?()<>]/;
  const WORD_CHAR = /[^\s!?()<>]/;

  function lastWordAt(text, caret) {
    const left = text.slice(0, caret);
    let end = left.length;
    while (end > 0 && SEPARATOR.test(left[end - 1])) end -= 1;
    let start = end;
    while (start > 0 && WORD_CHAR.test(left[start - 1])) start -= 1;
    const word = left.slice(start, end);
    const trailing = left.slice(end);
    return { word, start, end, trailing };
  }

  function createController(getSettings, hooks) {
    const state = {
      session: null,
      lastFix: null,
      pausing: false,
    };

    function layoutId(settings) {
      return settings.layoutId || KeyboardFix.guessDefaultLayout();
    }

    function inSession(el, direction) {
      return (
        state.session &&
        state.session.el === el &&
        state.session.direction === direction
      );
    }

    function beginSession(el, decision) {
      state.session = {
        el,
        direction: decision.direction,
        targetLang: decision.targetLang,
        startedAt: Date.now(),
      };
      hooks.onSession?.(state.session);
    }

    function endSession() {
      if (!state.session) return;
      const ended = state.session;
      state.session = null;
      hooks.onSessionEnd?.(ended);
    }

    function inspect(word, settings, el) {
      if (!word) return { convert: false };
      if (state.session && state.session.el === el && settings.sessionRemap) {
        const converted = KeyboardFix.convert(
          word,
          layoutId(settings),
          state.session.direction
        );
        if (converted !== word) {
          return {
            convert: true,
            word,
            converted,
            direction: state.session.direction,
            targetLang: state.session.targetLang,
            reason: "session",
            originalScore: 0,
            convertedScore: 8,
            delta: 8,
          };
        }
      }
      return KeyboardFix.shouldConvert(word, layoutId(settings), settings);
    }

    return {
      state,
      lastWordAt,
      inspect,
      beginSession,
      endSession,
      inSession,
      layoutId,
      defaults: DEFAULTS,
    };
  }

  KeyboardFix.DEFAULTS = DEFAULTS;
  KeyboardFix.lastWordAt = lastWordAt;
  KeyboardFix.createController = createController;
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
