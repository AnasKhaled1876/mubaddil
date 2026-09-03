(() => {
  const SKIP_TYPES = new Set([
    "password",
    "email",
    "url",
    "number",
    "date",
    "time",
    "hidden",
    "file",
    "color",
    "range",
  ]);

  let settings = { ...KeyboardFix.DEFAULTS, layoutId: "windows-101" };
  let idleTimer = null;
  let pauseTimer = null;

  const controller = KeyboardFix.createController(
    () => settings,
    {
      onSession() {
        showBanner(true);
      },
      onSessionEnd() {
        showBanner(false);
      },
    }
  );

  chrome.storage.sync.get(KeyboardFix.DEFAULTS, (stored) => {
    settings = { ...KeyboardFix.DEFAULTS, ...stored };
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== "sync") return;
    for (const [key, value] of Object.entries(changes)) {
      settings[key] = value.newValue;
    }
  });

  function isEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.isContentEditable) return true;
    if (el.tagName === "TEXTAREA") return true;
    if (el.tagName === "INPUT") {
      const type = (el.getAttribute("type") || "text").toLowerCase();
      if (SKIP_TYPES.has(type)) return false;
      return true;
    }
    return false;
  }

  function setNativeValue(el, value) {
    const proto =
      el.tagName === "TEXTAREA"
        ? HTMLTextAreaElement.prototype
        : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
    setter ? setter.call(el, value) : (el.value = value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function replaceInInput(el, start, end, next) {
    const value = el.value;
    const caret = el.selectionStart;
    const trailingLen = caret - end;
    setNativeValue(el, value.slice(0, start) + next + value.slice(end));
    const newCaret = start + next.length + Math.max(0, trailingLen);
    el.setSelectionRange(newCaret, newCaret);
  }

  function currentInputState(el) {
    if (el.isContentEditable) return null;
    const caret = el.selectionStart ?? el.value.length;
    const found = KeyboardFix.lastWordAt(el.value, caret);
    return { ...found, caret, value: el.value };
  }

  function applyFix(el, decision) {
    const state = currentInputState(el);
    if (!state || state.word !== decision.word) return false;
    replaceInInput(el, state.start, state.end, decision.converted);
    controller.state.lastFix = {
      el,
      start: state.start,
      before: decision.word,
      after: decision.converted,
      trailing: state.trailing,
    };
    return true;
  }

  function undoFix() {
    const fix = controller.state.lastFix;
    if (!fix?.el || !isEditable(fix.el)) return;
    const el = fix.el;
    if (el.isContentEditable) return;
    const value = el.value;
    const expected = fix.after;
    const from = fix.start;
    const to = from + expected.length;
    if (value.slice(from, to) !== expected) return;
    replaceInInput(el, from, to, fix.before);
    controller.state.lastFix = null;
    hideToast();
  }

  function maybeFix(el, { fromIdle } = {}) {
    if (!settings.enabled || controller.state.pausing) return;
    if (!isEditable(el) || el.isContentEditable) return;
    const state = currentInputState(el);
    if (!state?.word) return;
    if (!fromIdle && !state.trailing) return;

    const decision = controller.inspect(state.word, settings, el);
    if (!decision.convert) return;

    controller.state.pausing = true;
    pulseField(el, decision);
    showToast(decision, el);

    pauseTimer = setTimeout(() => {
      applyFix(el, decision);
      controller.beginSession(el, decision);
      controller.state.pausing = false;
      pulseField(el, { ...decision, done: true });
    }, settings.pauseMs);
  }

  function pulseField(el, decision) {
    el.classList.remove("mubaddil-wrong", "mubaddil-fixed");
    void el.offsetWidth;
    el.classList.add(decision.done ? "mubaddil-fixed" : "mubaddil-wrong");
    setTimeout(() => {
      el.classList.remove("mubaddil-wrong", "mubaddil-fixed");
    }, 900);
  }

  function ensureToast() {
    let toast = document.getElementById("mubaddil-toast");
    if (toast) return toast;
    toast = document.createElement("div");
    toast.id = "mubaddil-toast";
    toast.dir = "rtl";
    document.documentElement.appendChild(toast);
    return toast;
  }

  function showToast(decision, el) {
    const toast = ensureToast();
    const toAr = decision.targetLang === "ar";
    toast.innerHTML = `
      <div class="mubaddil-toast-card">
        <div class="mubaddil-toast-copy">
          <strong>${toAr ? "كانت الإنجليزية غلط" : "Wrong Arabic layout"}</strong>
          <span>${escapeHtml(decision.word)} → ${escapeHtml(decision.converted)}</span>
        </div>
        <button type="button" data-undo>تراجع</button>
      </div>
    `;
    toast.classList.add("is-visible");
    toast.querySelector("[data-undo]")?.addEventListener("click", () => {
      undoFix();
      controller.endSession();
    });
    clearTimeout(showToast.hideTimer);
    showToast.hideTimer = setTimeout(hideToast, 5000);
    el?.focus();
  }

  function hideToast() {
    document.getElementById("mubaddil-toast")?.classList.remove("is-visible");
  }

  function showBanner(on) {
    let banner = document.getElementById("mubaddil-banner");
    if (!on) {
      banner?.classList.remove("is-visible");
      return;
    }
    if (!banner) {
      banner = document.createElement("div");
      banner.id = "mubaddil-banner";
      banner.dir = "rtl";
      document.documentElement.appendChild(banner);
    }
    const lang = controller.state.session?.targetLang === "ar" ? "العربية" : "English";
    banner.innerHTML = `
      <span>نكتب الآن كـ <b>${lang}</b> — بدّل الكيبورد بـ Win+Space إذا قدرت</span>
      <button type="button" data-stop>تمام، كيبورد اتظبط</button>
    `;
    banner.classList.add("is-visible");
    banner.querySelector("[data-stop]")?.addEventListener("click", () => {
      controller.endSession();
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function onKeyDown(event) {
    if (event.key === "Escape") {
      controller.endSession();
      controller.state.pausing = false;
      hideToast();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      if (controller.state.lastFix) {
        event.preventDefault();
        undoFix();
        controller.endSession();
      }
    }
  }

  function onInput(event) {
    const el = event.target;
    if (!isEditable(el)) return;
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => maybeFix(el, { fromIdle: true }), settings.idleMs);
  }

  function onKeyUp(event) {
    const el = event.target;
    if (!isEditable(el)) return;
    if (event.key === " " || event.key === "Enter" || event.key === "Tab") {
      maybeFix(el, { fromIdle: false });
    }
  }

  document.addEventListener("keydown", onKeyDown, true);
  document.addEventListener("keyup", onKeyUp, true);
  document.addEventListener("input", onInput, true);
})();
