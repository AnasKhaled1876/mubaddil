const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "public");
const engineDest = path.join(dest, "engine");

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(engineDest, { recursive: true });

for (const file of ["index.html", "demo.css", "demo.js"]) {
  fs.copyFileSync(path.join(root, "demo", file), path.join(dest, file));
}

const engineSrc = path.join(root, "extension", "engine");
for (const file of fs.readdirSync(engineSrc)) {
  if (file.endsWith(".js")) {
    fs.copyFileSync(path.join(engineSrc, file), path.join(engineDest, file));
  }
}

const htmlPath = path.join(dest, "index.html");
const html = fs
  .readFileSync(htmlPath, "utf8")
  .replaceAll("../extension/engine/", "engine/");
fs.writeFileSync(htmlPath, html);

console.log("static demo ready in public/");
