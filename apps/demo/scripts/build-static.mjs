import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("dist/src", { recursive: true });
copyFileSync("index.html", "dist/index.html");
copyFileSync("src/styles.css", "dist/src/styles.css");
copyFileSync("src/demo-app.js", "dist/src/demo-app.js");
copyFileSync("src/demo-data.json", "dist/src/demo-data.json");
