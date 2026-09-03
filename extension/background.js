const DEFAULTS = {
  enabled: true,
  layoutId: "windows-101",
  minLength: 3,
  sensitivity: "balanced",
  pauseMs: 700,
  idleMs: 1100,
  sessionRemap: true,
};

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.get(DEFAULTS, (current) => {
    chrome.storage.sync.set({ ...DEFAULTS, ...current });
  });
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "get-settings") {
    chrome.storage.sync.get(DEFAULTS, sendResponse);
    return true;
  }
  return false;
});
