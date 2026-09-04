(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const ARABIC_WORDS = `
السلام عليكم ورحمة وبركاته مرحبا اهلا اهلاً سهلا شكرا شكراً عفوا نعم لا من فضلك لو سمحت
صباح الخير مساء الحمد لله إن شاء الله ما شاء الله الحمدلله يارب يا رب
`.trim();

  const ENGLISH_WORDS = `
hello hi hey thanks thank please yes okay ok good morning evening welcome sorry the and
`.trim();

  function toSet(text) {
    return new Set(
      text
        .split(/\s+/)
        .map((w) => w.trim())
        .filter(Boolean)
    );
  }

  KeyboardFix.ARABIC_WORDS = toSet(ARABIC_WORDS);
  KeyboardFix.ENGLISH_WORDS = toSet(ENGLISH_WORDS);
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
