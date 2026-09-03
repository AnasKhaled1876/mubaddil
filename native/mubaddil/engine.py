import re
import sys

ARABIC_WORDS = """
السلام عليكم ورحمة وبركاته مرحبا اهلا اهلاً سهلا شكرا شكراً عفوا نعم لا من فضلك لو سمحت
صباح الخير مساء الحمد لله إن شاء الله ما شاء الله الحمدلله يارب يا رب تسلم الله يعطيك العافية
كيف حالك اخبارك تمام بخير الحمد الحمدلله انا انت انتي هو هي نحن هم هن هذا هذه ذلك تلك
الذي التي الذين اللواتي في من على إلى الى عن مع أو او ثم قد لم لن كل بعض بعد قبل بين
تحت فوق هنا هناك كيف ماذا متى اين أين لماذا لان لأن اذا إذا حتى عند غير نفس مثل اول أول
اخر آخر جديد قديم كبير صغير كثير قليل حسن جيد سيء تمام حاضر ممكن ضروري مهم سريع بطيء
اليوم غدا غداً امس أمس الان الآن جدا فقط ايضا أيضا لكن ايضاً العمل البيت المدرسة الكتاب
الاسم رقم هاتف رسالة اجتماع موعد رجاء انتظر دقيقة
مصر السعودية الامارات الإمارات الكويت قطر البحرين عمان الاردن الأردن لبنان العراق المغرب
تونس الجزائر السودان اليمن فلسطين سوريا ليبيا
الكتب الكتابة العربي العربية انجليزي الانجليزية الكمبيوتر ويندوز ابل ماك كيبورد لوحة المفاتيح
اللغة غلط خطأ صح صحيح كلمة جملة نص كتب يكتب اكتب اريد اريد احتاج ممكن هل يوجد يوجد
افتح اغلق احفظ ارسل احذف ابحث ادخل اخرج ابدأ انتهي انتهى
الرجاء التأكد التحويل التبديل التصحيح
""".split()

ENGLISH_WORDS = """
the be to of and a in that have i it for not on with he as you do at this but his by from
they we say her she or an will my one all would there their what so up out if about who get
which go me when make can like time no just him know take people into year your good some
could them see other than then now look only come its over think also back after use two how
our work first well way even new want because any these give day most us hello hi hey thanks
thank please yes okay ok meeting email message boss please sorry welcome morning evening
arabic english keyboard language layout switch convert fix wrong type typing write written
windows mac laptop computer phone whatsapp word excel outlook gmail browser chrome
name number please wait minute second today tomorrow yesterday now later
egypt saudi emirates kuwait qatar bahrain oman jordan lebanon iraq morocco tunisia
algeria sudan yemen palestine syria
""".split()

WINDOWS_101_EN_TO_AR = {
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
    "q": "ض",
    "w": "ص",
    "e": "ث",
    "r": "ق",
    "t": "ف",
    "y": "غ",
    "u": "ع",
    "i": "ه",
    "o": "خ",
    "p": "ح",
    "[": "ج",
    "]": "د",
    "\\": "\\",
    "a": "ش",
    "s": "س",
    "d": "ي",
    "f": "ب",
    "g": "ل",
    "h": "ا",
    "j": "ت",
    "k": "ن",
    "l": "م",
    ";": "ك",
    "'": "ط",
    "z": "ئ",
    "x": "ء",
    "c": "ؤ",
    "v": "ر",
    "b": "لا",
    "n": "ى",
    "m": "ة",
    ",": "و",
    ".": "ز",
    "/": "ظ",
    " ": " ",
    "Q": "َ",
    "W": "ً",
    "E": "ُ",
    "R": "ٌ",
    "T": "لإ",
    "Y": "إ",
    "U": "‘",
    "I": "÷",
    "O": "×",
    "P": "؛",
    "{": "<",
    "}": ">",
    "A": "ِ",
    "S": "ٍ",
    "D": "]",
    "F": "[",
    "G": "لأ",
    "H": "أ",
    "J": "ـ",
    "K": "،",
    "L": "/",
    ":": ":",
    '"': '"',
    "Z": "~",
    "X": "ْ",
    "C": "}",
    "V": "{",
    "B": "لآ",
    "N": "آ",
    "M": "’",
    "<": ",",
    ">": ".",
    "?": "؟",
    "~": "ّ",
    "!": "!",
    "@": "@",
    "#": "#",
    "$": "$",
    "%": "%",
    "^": "^",
    "&": "&",
    "*": "*",
    "(": ")",
    ")": "(",
}

WINDOWS_102_EN_TO_AR = {**WINDOWS_101_EN_TO_AR, "`": "ذ", "#": "ذ", "\\": "\\"}

MAC_ARABIC_EN_TO_AR = {
    **WINDOWS_101_EN_TO_AR,
    "z": "ظ",
    "x": "ط",
    "c": "ذ",
    "v": "د",
    "b": "ز",
    "n": "ر",
    "m": "و",
    "]": "ة",
    ",": "،",
    ".": ".",
    "/": "/",
    "'": "؛",
    "`": "ـ",
    "Z": "ظ",
    "X": "ط",
    "C": "ذ",
    "V": "د",
    "B": "ز",
    "N": "ر",
    "M": "و",
}

LAYOUTS = {
    "windows-101": {
        "id": "windows-101",
        "label": "Windows Arabic 101",
        "label_ar": "ويندوز عربي 101",
        "device": "windows",
        "en_to_ar": WINDOWS_101_EN_TO_AR,
    },
    "windows-102": {
        "id": "windows-102",
        "label": "Windows Arabic 102",
        "label_ar": "ويندوز عربي 102",
        "device": "windows",
        "en_to_ar": WINDOWS_102_EN_TO_AR,
    },
    "mac-arabic-pc": {
        "id": "mac-arabic-pc",
        "label": "Mac Arabic - PC",
        "label_ar": "ماك عربي - PC",
        "device": "mac",
        "en_to_ar": WINDOWS_101_EN_TO_AR,
    },
    "mac-arabic": {
        "id": "mac-arabic",
        "label": "Mac Arabic (native)",
        "label_ar": "ماك عربي الأصلي",
        "device": "mac",
        "en_to_ar": MAC_ARABIC_EN_TO_AR,
    },
}

ARABIC_WORD_SET = set(ARABIC_WORDS)
ENGLISH_WORD_SET = set(ENGLISH_WORDS)
ARABIC_PREFIXES = ["ال", "وال", "بال", "لل", "فال", "كال", "و", "ب", "ف", "ك"]
ARABIC_SUFFIXES = ["ة", "ها", "هم", "هن", "كم", "كن", "نا", "ون", "ين", "ات", "ية", "تك"]
ENGLISH_BIGRAMS = set(
    "th he in er an re on at en nd ti es or te of ed is it al ar st to nt ng".split()
)
SKIP_RE = re.compile(
    r"@|https?:\/\/|www\.|[\u0660-\u0669\d]{2,}|[_/\\{}<>]|[A-Z]{2,}"
)
ARABIC_LETTER = re.compile(r"[\u0600-\u06FF]")
ARABIC_ONLY = re.compile(r"^[\u0600-\u06FF]+$")
LATIN_LETTER = re.compile(r"[A-Za-z]")
_REVERSE_CACHE = {}


def guess_default_layout(platform: str | None = None) -> str:
    name = (platform or sys.platform).lower()
    if "darwin" in name or "mac" in name:
        return "mac-arabic-pc"
    return "windows-101"


def _invert(en_to_ar: dict) -> dict:
    ar_to_en = {}
    ligatures = []
    for en, ar in en_to_ar.items():
        if not ar:
            continue
        if len(ar) > 1:
            ligatures.append({"ar": ar, "en": en})
        elif ar not in ar_to_en:
            ar_to_en[ar] = en
    ligatures.sort(key=lambda item: len(item["ar"]), reverse=True)
    return {"ar_to_en": ar_to_en, "ligatures": ligatures}


def get_layout(layout_id: str | None) -> dict:
    layout = LAYOUTS.get(layout_id) or LAYOUTS["windows-101"]
    cached = _REVERSE_CACHE.get(layout["id"])
    if cached is None:
        cached = _invert(layout["en_to_ar"])
        _REVERSE_CACHE[layout["id"]] = cached
    return {**layout, "reverse": cached}


def script_of(text: str) -> str:
    arabic = latin = 0
    for ch in text:
        if ARABIC_LETTER.search(ch):
            arabic += 1
        elif LATIN_LETTER.search(ch):
            latin += 1
    if arabic and not latin:
        return "arabic"
    if latin and not arabic:
        return "latin"
    if arabic and latin:
        return "mixed"
    return "other"


def convert_latin_to_arabic(text: str, layout: dict) -> str:
    table = layout["en_to_ar"]
    return "".join(table.get(ch, ch) for ch in text)


def convert_arabic_to_latin(text: str, layout: dict) -> str:
    ar_to_en = layout["reverse"]["ar_to_en"]
    ligatures = layout["reverse"]["ligatures"]
    out = []
    i = 0
    while i < len(text):
        matched = False
        for lig in ligatures:
            if text.startswith(lig["ar"], i):
                out.append(lig["en"])
                i += len(lig["ar"])
                matched = True
                break
        if matched:
            continue
        ch = text[i]
        out.append(ar_to_en.get(ch, ch))
        i += 1
    return "".join(out)


def convert(text: str, layout_id: str, direction: str | None = None) -> str:
    layout = get_layout(layout_id)
    if direction == "en-to-ar":
        return convert_latin_to_arabic(text, layout)
    if direction == "ar-to-en":
        return convert_arabic_to_latin(text, layout)
    script = script_of(text)
    if script == "latin":
        return convert_latin_to_arabic(text, layout)
    if script == "arabic":
        return convert_arabic_to_latin(text, layout)
    return text


def normalize(word: str) -> str:
    return re.sub(r"[ًٌٍَُِّْ]", "", re.sub(r"[^\u0600-\u06FFa-zA-Z'-]", "", word))


def arabic_pattern_score(word: str) -> int:
    if not word:
        return 0
    score = 0
    for prefix in ARABIC_PREFIXES:
        if word.startswith(prefix) and len(word) > len(prefix):
            score += 3 if len(prefix) >= 2 else 1
            break
    for suffix in ARABIC_SUFFIXES:
        if word.endswith(suffix) and len(word) > len(suffix):
            score += 2
            break
    common = sum(1 for ch in word if ch in "اليمنوترب")
    score += min(4, common)
    if ARABIC_ONLY.fullmatch(word):
        score += 1
    return score


def english_pattern_score(word: str) -> int:
    lower = word.lower()
    if not lower:
        return 0
    letters = re.findall(r"[a-z]", lower)
    if not letters:
        return 0
    vowels = re.findall(r"[aeiou]", lower)
    score = 0
    if not vowels and len(letters) >= 3:
        score -= 4
    else:
        score += min(3, len(vowels))
    for i in range(len(lower) - 1):
        if lower[i : i + 2] in ENGLISH_BIGRAMS:
            score += 1
    if re.search(r"[bcdfghjklmnpqrstvwxyz]{4,}", lower):
        score -= 3
    return score


def word_score(word: str, lang: str) -> int:
    clean = normalize(word)
    if not clean:
        return 0
    if lang == "ar":
        if clean in ARABIC_WORD_SET:
            return 12
        return arabic_pattern_score(clean)
    lower = clean.lower()
    if lower in ENGLISH_WORD_SET:
        return 12
    return english_pattern_score(lower)


def analyze_word(word: str, layout_id: str) -> dict:
    clean = word.strip()
    script = script_of(clean)
    if not clean or script in {"mixed", "other"}:
        return {"action": "none", "reason": "unsupported-script", "convert": False}
    if SKIP_RE.search(clean):
        return {"action": "none", "reason": "skipped-token", "convert": False}

    converted = convert(clean, layout_id)
    original_lang = "ar" if script == "arabic" else "en"
    converted_lang = "en" if original_lang == "ar" else "ar"
    original_score = word_score(clean, original_lang)
    converted_score = word_score(converted, converted_lang)
    return {
        "action": "score",
        "word": clean,
        "converted": converted,
        "original_lang": original_lang,
        "converted_lang": converted_lang,
        "original_score": original_score,
        "converted_score": converted_score,
        "delta": converted_score - original_score,
        "direction": "en-to-ar" if original_lang == "en" else "ar-to-en",
    }


def should_convert(word: str, layout_id: str, options: dict | None = None) -> dict:
    options = options or {}
    min_length = options.get("min_length", 3)
    sensitivity = options.get("sensitivity", "balanced")
    needed = {"conservative": 8, "balanced": 5, "aggressive": 3}.get(sensitivity, 5)
    analysis = analyze_word(word, layout_id)
    if analysis.get("action") != "score":
        analysis["convert"] = False
        return analysis
    if len(normalize(analysis["word"])) < min_length:
        return {**analysis, "convert": False, "reason": "too-short"}
    if analysis["original_score"] >= 10 and analysis["delta"] < 4:
        return {**analysis, "convert": False, "reason": "already-valid"}
    if analysis["converted_score"] < 4:
        return {**analysis, "convert": False, "reason": "weak-target"}
    if analysis["delta"] < needed:
        return {**analysis, "convert": False, "reason": "low-confidence"}
    return {
        **analysis,
        "convert": True,
        "reason": "wrong-layout",
        "target_lang": analysis["converted_lang"],
    }
