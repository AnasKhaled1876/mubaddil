const box = document.getElementById("box");
const layout = document.getElementById("layout");
const sensitivity = document.getElementById("sensitivity");
const session = document.getElementById("session");
const status = document.getElementById("status");
const toast = document.getElementById("toast");
const banner = document.getElementById("banner");

for (const item of Object.values(KeyboardFix.LAYOUTS)) {
  const option = document.createElement("option");
  option.value = item.id;
  option.textContent = `${item.labelAr} / ${item.label}`;
  if (item.id === KeyboardFix.guessDefaultLayout()) option.selected = true;
  layout.append(option);
}

const controller = KeyboardFix.createController(getSettings, {
  onSession() {
    const lang = controller.state.session.targetLang === "ar" ? "العربية" : "English";
    banner.hidden = false;
    banner.innerHTML = `<span>نكتب الآن كـ <b>${lang}</b></span><button type="button">الكيبورد اتظبط</button>`;
    banner.querySelector("button").onclick = () => controller.endSession();
  },
  onSessionEnd() {
    banner.hidden = true;
  },
});

function getSettings() {
  return {
    ...KeyboardFix.DEFAULTS,
    layoutId: layout.value,
    sensitivity: sensitivity.value,
    sessionRemap: session.checked,
    pauseMs: 700,
  };
}

let idleTimer = null;

function currentWord() {
  return KeyboardFix.lastWordAt(box.value, box.selectionStart);
}

function replaceWord(from, to, next) {
  const caret = box.selectionStart;
  const trailing = Math.max(0, caret - to);
  box.value = box.value.slice(0, from) + next + box.value.slice(to);
  const nextCaret = from + next.length + trailing;
  box.setSelectionRange(nextCaret, nextCaret);
}

function showToast(decision) {
  toast.hidden = false;
  toast.innerHTML = `<span>${decision.word} → ${decision.converted}</span><button type="button">تراجع</button>`;
  toast.querySelector("button").onclick = undo;
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    toast.hidden = true;
  }, 5000);
}

function undo() {
  const fix = controller.state.lastFix;
  if (!fix) return;
  if (box.value.slice(fix.start, fix.start + fix.after.length) === fix.after) {
    replaceWord(fix.start, fix.start + fix.after.length, fix.before);
  }
  controller.state.lastFix = null;
  controller.endSession();
  toast.hidden = true;
  status.textContent = "تم التراجع";
  status.className = "status idle";
}

function maybeFix({ fromIdle } = {}) {
  if (controller.state.pausing) return;
  const found = currentWord();
  if (!found.word) return;
  if (!fromIdle && !found.trailing) return;

  const decision = controller.inspect(found.word, getSettings(), box);
  if (!decision.convert) {
    status.textContent = found.word
      ? `${found.word} — لسه مش واثق إنها غلط`
      : "في انتظار الكتابة";
    status.className = "status idle";
    return;
  }

  controller.state.pausing = true;
  box.classList.add("wrong");
  status.textContent = `وقفنا لحظة: ${decision.word} مكتوبة بالكيبورد الغلط`;
  status.className = "status fixing";
  showToast(decision);

  setTimeout(() => {
    const latest = currentWord();
    if (latest.word === decision.word) {
      replaceWord(latest.start, latest.end, decision.converted);
      controller.state.lastFix = {
        el: box,
        start: latest.start,
        before: decision.word,
        after: decision.converted,
      };
      controller.beginSession(box, decision);
    }
    box.classList.remove("wrong");
    box.classList.add("fixed");
    status.textContent = `اتظبطت → ${decision.converted}`;
    status.className = "status done";
    controller.state.pausing = false;
    setTimeout(() => box.classList.remove("fixed"), 700);
    box.focus();
  }, getSettings().pauseMs);
}

box.addEventListener("input", () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => maybeFix({ fromIdle: true }), 1100);
});

box.addEventListener("keyup", (event) => {
  if (event.key === " " || event.key === "Enter") maybeFix({ fromIdle: false });
});

box.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    controller.endSession();
    toast.hidden = true;
  }
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z" && controller.state.lastFix) {
    event.preventDefault();
    undo();
  }
});

document.querySelectorAll("[data-sample]").forEach((button) => {
  button.addEventListener("click", () => {
    box.value = button.getAttribute("data-sample");
    box.focus();
    box.selectionStart = box.value.length;
    box.selectionEnd = box.value.length;
    maybeFix({ fromIdle: false });
  });
});
