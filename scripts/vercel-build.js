const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const dest = path.join(root, "public");

fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });

for (const file of ["index.html", "demo.css", "demo.js"]) {
  fs.copyFileSync(path.join(root, "demo", file), path.join(dest, file));
}

console.log("static demo ready in public/");
