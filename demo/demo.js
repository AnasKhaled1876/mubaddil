const langToggle = document.getElementById("lang-toggle");
const sceneText = document.getElementById("scene-text");

const TYPE_MS = 95;
const HOLD_MS = 280;
const FLIP_MS = 720;
const BETWEEN_MS = 220;
const END_MS = 2200;

let lang = "ar";
let playId = 0;

function applyLang(next) {
  document.documentElement.lang = next === "en" ? "en" : "ar";
  document.documentElement.dir = next === "en" ? "ltr" : "rtl";
  document.querySelectorAll("[data-ar]").forEach((el) => {
    el.textContent = next === "en" ? el.getAttribute("data-en") : el.getAttribute("data-ar");
  });
  langToggle.textContent = next === "en" ? "عربي" : "EN";
  langToggle.setAttribute("aria-label", next === "en" ? "العربية" : "English");
}

langToggle.addEventListener("click", () => {
  lang = lang === "ar" ? "en" : "ar";
  applyLang(lang);
});

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function sleep(ms, token) {
  return new Promise((resolve) => {
    const timer = setTimeout(resolve, ms);
    if (token) token.cancel = () => clearTimeout(timer);
  });
}

function clearScene() {
  sceneText.replaceChildren();
}

function addWord(text, kind) {
  const word = document.createElement("span");
  word.className = `word ${kind}`;
  word.textContent = text;
  sceneText.append(word);
  return word;
}

function addSpace() {
  sceneText.append(document.createTextNode(" "));
}

async function typeInto(word, text, token) {
  word.textContent = "";
  for (const letter of text) {
    if (token.stopped) return;
    word.textContent += letter;
    await sleep(TYPE_MS, token);
  }
}

function showFinished() {
  clearScene();
  addWord("السلام", "fixed");
  addSpace();
  addWord("عليكم", "fixed");
}

async function playLoop(token) {
  while (!token.stopped) {
    if (document.visibilityState === "hidden") {
      await sleep(400, token);
      continue;
    }

    clearScene();
    const first = addWord("", "wrong");
    await typeInto(first, "hgsghl", token);
    if (token.stopped) return;
    await sleep(HOLD_MS, token);
    first.textContent = "السلام";
    first.classList.remove("wrong");
    first.classList.add("fixed");
    await sleep(FLIP_MS, token);

    addSpace();
    const second = addWord("", "wrong");
    await typeInto(second, "ugd;l", token);
    if (token.stopped) return;
    await sleep(HOLD_MS, token);
    second.textContent = "عليكم";
    second.classList.remove("wrong");
    second.classList.add("fixed");
    await sleep(END_MS, token);
    await sleep(BETWEEN_MS, token);
  }
}

function startScene() {
  playId += 1;
  const token = { stopped: false, id: playId };
  if (prefersReducedMotion()) {
    showFinished();
    return token;
  }
  playLoop(token);
  return token;
}

let current = startScene();

window.matchMedia("(prefers-reduced-motion: reduce)").addEventListener("change", () => {
  current.stopped = true;
  current = startScene();
});
