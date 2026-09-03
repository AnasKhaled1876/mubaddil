const enabled = document.getElementById("enabled");
const layoutId = document.getElementById("layoutId");

for (const layout of Object.values(KeyboardFix.LAYOUTS)) {
  const option = document.createElement("option");
  option.value = layout.id;
  option.textContent = layout.labelAr + " — " + layout.label;
  layoutId.append(option);
}

chrome.storage.sync.get(
  { enabled: true, layoutId: KeyboardFix.guessDefaultLayout() },
  (stored) => {
    enabled.checked = stored.enabled !== false;
    layoutId.value = stored.layoutId;
  }
);

enabled.addEventListener("change", () => {
  chrome.storage.sync.set({ enabled: enabled.checked });
});

layoutId.addEventListener("change", () => {
  chrome.storage.sync.set({ layoutId: layoutId.value });
});
