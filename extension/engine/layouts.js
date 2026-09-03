/**
 * Physical-key maps between English QWERTY and Arabic layouts.
 * Device matters: Windows 101, Windows 102, and native macOS Arabic differ.
 */
(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const WINDOWS_101_EN_TO_AR = {
    "`": "ذ",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "0": "0",
    "-": "-",
    "=": "=",
    q: "ض",
    w: "ص",
    e: "ث",
    r: "ق",
    t: "ف",
    y: "غ",
    u: "ع",
    i: "ه",
    o: "خ",
    p: "ح",
    "[": "ج",
    "]": "د",
    "\\": "\\",
    a: "ش",
    s: "س",
    d: "ي",
    f: "ب",
    g: "ل",
    h: "ا",
    j: "ت",
    k: "ن",
    l: "م",
    ";": "ك",
    "'": "ط",
    z: "ئ",
    x: "ء",
    c: "ؤ",
    v: "ر",
    b: "لا",
    n: "ى",
    m: "ة",
    ",": "و",
    ".": "ز",
    "/": "ظ",
    " ": " ",
    Q: "َ",
    W: "ً",
    E: "ُ",
    R: "ٌ",
    T: "لإ",
    Y: "إ",
    U: "‘",
    I: "÷",
    O: "×",
    P: "؛",
    "{": "<",
    "}": ">",
    A: "ِ",
    S: "ٍ",
    D: "]",
    F: "[",
    G: "لأ",
    H: "أ",
    J: "ـ",
    K: "،",
    L: "/",
    ":": ":",
    '"': '"',
    Z: "~",
    X: "ْ",
    C: "}",
    V: "{",
    B: "لآ",
    N: "آ",
    M: "’",
    "<": ",",
    ">": ".",
    "?": "؟",
    "~": "ّ",
    "!": "!",
    "@": "@",
    "#": "#",
    $: "$",
    "%": "%",
    "^": "^",
    "&": "&",
    "*": "*",
    "(": ")",
    ")": "(",
  };

  // Arabic 102 keeps the same letters. ذ moves from backtick to the ISO key
  // (often typed as \\ on ANSI boards) and a few punctuation keys swap.
  const WINDOWS_102_EN_TO_AR = {
    ...WINDOWS_101_EN_TO_AR,
    "`": "ذ",
    "#": "ذ",
    "\\": "\\",
  };

  // Apple's native "Arabic" source. Top + home rows match 101; bottom row
  // and a few right-side keys move. "Arabic - PC" on Mac is Windows 101.
  const MAC_ARABIC_EN_TO_AR = {
    ...WINDOWS_101_EN_TO_AR,
    z: "ظ",
    x: "ط",
    c: "ذ",
    v: "د",
    b: "ز",
    n: "ر",
    m: "و",
    "]": "ة",
    ",": "،",
    ".": ".",
    "/": "/",
    "'": "؛",
    "`": "ـ",
    Z: "ظ",
    X: "ط",
    C: "ذ",
    V: "د",
    B: "ز",
    N: "ر",
    M: "و",
  };

  const LAYOUTS = {
    "windows-101": {
      id: "windows-101",
      label: "Windows Arabic 101",
      labelAr: "ويندوز عربي 101",
      device: "windows",
      enToAr: WINDOWS_101_EN_TO_AR,
    },
    "windows-102": {
      id: "windows-102",
      label: "Windows Arabic 102",
      labelAr: "ويندوز عربي 102",
      device: "windows",
      enToAr: WINDOWS_102_EN_TO_AR,
    },
    "mac-arabic-pc": {
      id: "mac-arabic-pc",
      label: "Mac Arabic - PC",
      labelAr: "ماك عربي - PC",
      device: "mac",
      enToAr: WINDOWS_101_EN_TO_AR,
    },
    "mac-arabic": {
      id: "mac-arabic",
      label: "Mac Arabic (native)",
      labelAr: "ماك عربي الأصلي",
      device: "mac",
      enToAr: MAC_ARABIC_EN_TO_AR,
    },
  };

  function invertMap(enToAr) {
    const arToEn = {};
    const singles = [];
    const ligatures = [];

    for (const [en, ar] of Object.entries(enToAr)) {
      if (!ar) continue;
      if (ar.length > 1) {
        ligatures.push({ ar, en });
      } else {
        if (arToEn[ar] === undefined) arToEn[ar] = en;
        singles.push({ ar, en });
      }
    }

    ligatures.sort((a, b) => b.ar.length - a.ar.length);
    return { arToEn, ligatures };
  }

  const reverseCache = {};

  function getLayout(layoutId) {
    const layout = LAYOUTS[layoutId] || LAYOUTS["windows-101"];
    if (!reverseCache[layout.id]) {
      reverseCache[layout.id] = invertMap(layout.enToAr);
    }
    return {
      ...layout,
      reverse: reverseCache[layout.id],
    };
  }

  function guessDefaultLayout() {
    const platform = (
      root.navigator?.userAgentData?.platform ||
      root.navigator?.platform ||
      ""
    ).toLowerCase();
    if (platform.includes("mac")) return "mac-arabic-pc";
    return "windows-101";
  }

  KeyboardFix.LAYOUTS = LAYOUTS;
  KeyboardFix.getLayout = getLayout;
  KeyboardFix.guessDefaultLayout = guessDefaultLayout;
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
