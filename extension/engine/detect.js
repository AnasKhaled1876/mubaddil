(function (root) {
  const KeyboardFix = root.KeyboardFix || {};

  const ARABIC_PREFIXES = ["ال", "وال", "بال", "لل", "فال", "كال", "و", "ب", "ف", "ك"];
  const ARABIC_SUFFIXES = ["ة", "ها", "هم", "هن", "كم", "كن", "نا", "ون", "ين", "ات", "ية", "تك"];
  const ENGLISH_BIGRAMS = new Set(
    "th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng".split(" ")
  );
  const SKIP_RE =
    /@|https?:\/\/|www\.|[\u0660-\u0669\d]{2,}|[_/\\{}<>]|[A-Z]{2,}/;

  function normalize(word) {
    return word
      .replace(/[^\u0600-\u06FFa-zA-Z'-]/g, "")
      .replace(/[ًٌٍَُِّْ]/g, "");
  }

  function looksLikeCodeOrId(word) {
    return SKIP_RE.test(word);
  }

  function arabicPatternScore(word) {
    if (!word) return 0;
    let score = 0;
    for (const prefix of ARABIC_PREFIXES) {
      if (word.startsWith(prefix) && word.length > prefix.length) {
        score += prefix.length >= 2 ? 3 : 1;
        break;
      }
    }
    for (const suffix of ARABIC_SUFFIXES) {
      if (word.endsWith(suffix) && word.length > suffix.length) {
        score += 2;
        break;
      }
    }
    const common = (word.match(/[اليمنوترب]/g) || []).length;
    score += Math.min(4, common);
    if (/^[\u0600-\u06FF]+$/.test(word)) score += 1;
    return score;
  }

  function englishPatternScore(word) {
    const lower = word.toLowerCase();
    if (!lower) return 0;
    let score = 0;
    const vowels = (lower.match(/[aeiou]/g) || []).length;
    const letters = (lower.match(/[a-z]/g) || []).length;
    if (!letters) return 0;
    if (vowels === 0 && letters >= 3) score -= 4;
    else score += Math.min(3, vowels);
    for (let i = 0; i < lower.length - 1; i += 1) {
      if (ENGLISH_BIGRAMS.has(lower.slice(i, i + 2))) score += 1;
    }
    if (/[bcdfghjklmnpqrstvwxyz]{4,}/.test(lower)) score -= 3;
    return score;
  }

  function wordScore(word, lang) {
    const clean = normalize(word);
    if (!clean) return 0;
    if (lang === "ar") {
      if (KeyboardFix.ARABIC_WORDS.has(clean)) return 12;
      return arabicPatternScore(clean);
    }
    const lower = clean.toLowerCase();
    if (KeyboardFix.ENGLISH_WORDS.has(lower)) return 12;
    return englishPatternScore(lower);
  }

  function analyzeWord(word, layoutId) {
    const clean = word.trim();
    const script = KeyboardFix.scriptOf(clean);
    if (!clean || script === "mixed" || script === "other") {
      return { action: "none", reason: "unsupported-script" };
    }
    if (looksLikeCodeOrId(clean)) {
      return { action: "none", reason: "skipped-token" };
    }

    const converted = KeyboardFix.convert(clean, layoutId);
    const originalLang = script === "arabic" ? "ar" : "en";
    const convertedLang = originalLang === "ar" ? "en" : "ar";
    const originalScore = wordScore(clean, originalLang);
    const convertedScore = wordScore(converted, convertedLang);

    return {
      action: "score",
      word: clean,
      converted,
      originalLang,
      convertedLang,
      originalScore,
      convertedScore,
      delta: convertedScore - originalScore,
      direction: originalLang === "en" ? "en-to-ar" : "ar-to-en",
    };
  }

  function shouldConvert(word, layoutId, options = {}) {
    const minLength = options.minLength ?? 3;
    const sensitivity = options.sensitivity ?? "balanced";
    const thresholds = {
      conservative: 8,
      balanced: 5,
      aggressive: 3,
    };
    const needed = thresholds[sensitivity] ?? thresholds.balanced;
    const analysis = analyzeWord(word, layoutId);

    if (analysis.action !== "score") return { ...analysis, convert: false };
    if (normalize(analysis.word).length < minLength) {
      return { ...analysis, convert: false, reason: "too-short" };
    }
    if (analysis.originalScore >= 10 && analysis.delta < 4) {
      return { ...analysis, convert: false, reason: "already-valid" };
    }
    if (analysis.convertedScore < 4) {
      return { ...analysis, convert: false, reason: "weak-target" };
    }
    if (analysis.delta < needed) {
      return { ...analysis, convert: false, reason: "low-confidence" };
    }

    return {
      ...analysis,
      convert: true,
      reason: "wrong-layout",
      targetLang: analysis.convertedLang,
    };
  }

  KeyboardFix.analyzeWord = analyzeWord;
  KeyboardFix.shouldConvert = shouldConvert;
  KeyboardFix.normalizeWord = normalize;
  root.KeyboardFix = KeyboardFix;
})(typeof globalThis !== "undefined" ? globalThis : window);
