const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.join(__dirname, "..", "extension", "engine");
const context = { console, globalThis: {} };
context.globalThis = context;
vm.createContext(context);

for (const file of ["layouts.js", "dictionaries.js", "convert.js", "detect.js", "controller.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, file), "utf8"), context);
}

const KF = context.KeyboardFix;
const fails = [];

function assert(name, actual, expected) {
  if (actual !== expected) {
    fails.push(`${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

assert("سلام from english", KF.convert("hgsghl", "windows-101"), "السلام");
assert("عليكم from english", KF.convert("ugd;l", "windows-101"), "عليكم");
assert("مرحبا from english", KF.convert("lvpfh", "windows-101"), "مرحبا");
assert("hello from arabic", KF.convert("اثممخ", "windows-101"), "hello");
assert("there from arabic", KF.convert("فاثقث", "windows-101"), "there");
assert("thanks from arabic", KF.convert("فاشىنس", "windows-101"), "thanks");
assert("please from arabic", KF.convert("حمثشسث", "windows-101"), "please");
assert("meeting from arabic", KF.convert("ةثثفهىل", "windows-101"), "meeting");
assert("tomorrow from arabic", KF.convert("فخةخققخص", "windows-101"), "tomorrow");
assert("ما from lh", KF.convert("lh", "windows-101"), "ما");

const greeting = KF.shouldConvert("hgsghl", "windows-101");
assert("detect السلام", greeting.convert && greeting.converted === "السلام" ? "yes" : "no", "yes");

const alaykum = KF.shouldConvert("ugd;l", "windows-101");
assert("detect عليكم keeps semicolon letter", alaykum.convert && alaykum.converted === "عليكم" ? "yes" : "no", "yes");

const found = KF.lastWordAt("السلام ugd;l ", 13);
assert("last word includes ;", found.word, "ugd;l");

const helloAr = KF.shouldConvert("اثممخ", "windows-101");
assert("detect hello", helloAr.convert && helloAr.converted === "hello" ? "yes" : "no", "yes");

const hello = KF.shouldConvert("hello", "windows-101");
assert("do not convert hello", hello.convert ? "yes" : "no", "no");

const salaam = KF.shouldConvert("السلام", "windows-101");
assert("do not convert real arabic", salaam.convert ? "yes" : "no", "no");

const noise = KF.shouldConvert("qwerty", "windows-101");
assert("reject non-dictionary latin", noise.convert ? "yes" : "no", "no");

const macZ = KF.convert("z", "mac-arabic");
const winZ = KF.convert("z", "windows-101");
assert("mac z is ظ", macZ, "ظ");
assert("windows z is ئ", winZ, "ئ");
assert("egyptian ازيك present", KF.ARABIC_WORDS.has("ازيك") ? "yes" : "no", "yes");
assert("egyptian كده present", KF.ARABIC_WORDS.has("كده") ? "yes" : "no", "yes");
assert("egyptian دلوقتي present", KF.ARABIC_WORDS.has("دلوقتي") ? "yes" : "no", "yes");
assert("name صابر present", KF.ARABIC_WORDS.has("صابر") ? "yes" : "no", "yes");
assert("name أنس present", KF.ARABIC_WORDS.has("أنس") ? "yes" : "no", "yes");
assert("english dict expanded", KF.ENGLISH_WORDS.size > 40000 ? "yes" : "no", "yes");
assert("meeting present", KF.ENGLISH_WORDS.has("meeting") ? "yes" : "no", "yes");
assert("john present", KF.ENGLISH_WORDS.has("john") ? "yes" : "no", "yes");

if (fails.length) {
  console.error(fails.join("\n"));
  process.exit(1);
}

console.log("engine tests passed");
