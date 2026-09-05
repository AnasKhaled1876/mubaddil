const layout = document.getElementById("layout");
const status = document.getElementById("status");
const langToggle = document.getElementById("lang-toggle");
const boxes = [...document.querySelectorAll(".try-box")];

for (const item of Object.values(KeyboardFix.LAYOUTS)) {
  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = `${item.labelAr} / ${item.label}`;
  if (item.id === KeyboardFix.guessDefaultLayout()) option.selected = true;
  layout.append(option);
}

const controller = KeyboardFix.createController(() => getSettings(), {});
const fields = new WeakMap();

function fieldState(box) {
  if (!fields.has(box)) {
    fields.set(box, { done: false, opening: 0 });
  }
  return fields.get(box);
}

function getSettings() {
  return {
    ...KeyboardFix.DEFAULTS,
    layoutId: layout.value,
    sessionRemap: false,
    pauseMs: 0,
    idleMs: 0,
  };
}

function replaceWord(box, from, to, next) {
  const caret = box.selectionStart;
  const trailing = Math.max(0, caret - to);
  box.value = box.value.slice(0, from) + next + box.value.slice(to);
  const nextCaret = from + next.length + trailing;
  box.setSelectionRange(nextCaret, nextCaret);
}

function setStatus(text, kind) {
  status.textContent = text;
  status.className = "demo-hint" + (kind ? ` ${kind}` : "");
}

function maybeFix(box) {
  const state = fieldState(box);
  if (state.done || controller.state.pausing) return;

  const found = KeyboardFix.lastWordAt(box.value, box.selectionStart);
  if (!found.word || !found.trailing) return;

  const decision = controller.inspect(found.word, getSettings(), box);
  state.opening += 1;

  if (decision.convert) {
    replaceWord(box, found.start, found.end, decision.converted);
    controller.state.lastFix = {
      el: box,
      start: found.start,
      before: decision.word,
      after: decision.converted,
    };
    box.classList.add("fixed");
    setTimeout(() => box.classList.remove("fixed"), 500);
    setStatus(`اتظبطت → ${decision.converted}`, "done");
    state.done = true;
    return;
  }

  if (state.opening >= 2) {
    state.done = true;
    setStatus("اتنين كلمات — الخانة دي خلصت", "");
    return;
  }

  setStatus(`${found.word} — مستني الكلمة التانية`, "");
}

boxes.forEach((box) => {
  box.addEventListener("focus", () => {
    setStatus("اكتب كلمة ثم مسافة", "");
  });

  box.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") maybeFix(box);
  });

  box.addEventListener("keydown", (event) => {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
      const fix = controller.state.lastFix;
      if (!fix || fix.el !== box) return;
      event.preventDefault();
      if (box.value.slice(fix.start, fix.start + fix.after.length) === fix.after) {
        replaceWord(box, fix.start, fix.start + fix.after.length, fix.before);
      }
      controller.state.lastFix = null;
      const state = fieldState(box);
      state.done = false;
      state.opening = 0;
      setStatus("تم التراجع", "");
    }
  });
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    const box = document.getElementById(button.getAttribute("data-target")) || boxes[0];
    fields.set(box, { done: false, opening: 0 });
    box.value = button.getAttribute("data-sample");
    box.focus();
    box.selectionStart = box.value.length;
    box.selectionEnd = box.value.length;
    maybeFix(box);
  });
});

function applyLang(lang) {
  document.documentElement.lang = lang === "en" ? "en" : "ar";
  document.documentElement.dir = lang === "en" ? "ltr" : "rtl";
  document.querySelectorAll("[data-ar]").forEach((el) => {
    el.textContent = lang === "en" ? el.getAttribute("data-en") : el.getAttribute("data-ar");
  });
  langToggle.textContent = lang === "en" ? "عربي" : "EN";
  langToggle.setAttribute("aria-label", lang === "en" ? "العربية" : "English");
}

let lang = "ar";
langToggle.addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang(lang);
});
