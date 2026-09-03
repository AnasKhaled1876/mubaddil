(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const ARABIC_LETTER = /[\u0600-\u06FF]/;
  const LATIN_LETTER = /[A-Za-z]/;

  function scriptOf(text) {
    let arabic = 0;
    let latin = 0;
    for (const ch of text) {
      if (ARABIC_LETTER.test(ch)) arabic += 1;
      else if (LATIN_LETTER.test(ch)) latin += 1;
    }
    if (arabic && !latin) return "arabic";
    if (latin && !arabic) return "latin";
    if (arabic && latin) return "mixed";
    return "other";
  }

  function convertLatinToArabic(text, layout) {
    let out = "";
    for (const ch of text) {
      out += layout.enToAr[ch] ?? ch;
    }
    return out;
  }

  function convertArabicToLatin(text, layout) {
    const { arToEn, ligatures } = layout.reverse;
    let out = "";
    let i = 0;
    while (i < text.length) {
      let matched = false;
      for (const lig of ligatures) {
        if (text.startsWith(lig.ar, i)) {
          out += lig.en;
          i += lig.ar.length;
          matched = true;
          break;
        }
      }
      if (matched) continue;
      const ch = text[i];
      out += arToEn[ch] ?? ch;
      i += 1;
    }
    return out;
  }

  function convert(text, layoutId, direction) {
    const layout = KeyboardFix.getLayout(layoutId);
    if (direction === "en-to-ar") return convertLatinToArabic(text, layout);
    if (direction === "ar-to-en") return convertArabicToLatin(text, layout);

    const script = scriptOf(text);
    if (script === "latin") return convertLatinToArabic(text, layout);
    if (script === "arabic") return convertArabicToLatin(text, layout);
    return text;
  }

  KeyboardFix.scriptOf = scriptOf;
  KeyboardFix.convert = convert;
  KeyboardFix.convertLatinToArabic = convertLatinToArabic;
  KeyboardFix.convertArabicToLatin = convertArabicToLatin;
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
