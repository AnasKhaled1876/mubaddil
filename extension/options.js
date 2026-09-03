const layoutId = document.getElementById("layoutId");
const sensitivity = document.getElementById("sensitivity");
const pauseMs = document.getElementById("pauseMs");
const sessionRemap = document.getElementById("sessionRemap");

for (const layout of Object.values(KeyboardFix.LAYOUTS)) {
  const option = document.createElement("option");
  option.value = layout.id;
  option.textContent = `${layout.labelAr} — ${layout.label}`;
  layoutId.append(option);
}

const keys = ["layoutId", "sensitivity", "pauseMs", "sessionRemap"];

chrome.storage.sync.get(
  {
    layoutId: "windows-101",
    sensitivity: "balanced",
    pauseMs: 700,
    sessionRemap: true,
  },
  (stored) => {
    layoutId.value = stored.layoutId;
    sensitivity.value = stored.sensitivity;
    pauseMs.value = stored.pauseMs;
    sessionRemap.checked = stored.sessionRemap !== false;
  }
);

function save() {
  chrome.storage.sync.set({
    layoutId: layoutId.value,
    sensitivity: sensitivity.value,
    pauseMs: Number(pauseMs.value) || 700,
    sessionRemap: sessionRemap.checked,
  });
}

for (const el of [layoutId, sensitivity, pauseMs, sessionRemap]) {
  el.addEventListener("change", save);
}

void keys;
