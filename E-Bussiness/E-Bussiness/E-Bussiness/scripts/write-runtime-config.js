const fs = require("node:fs");
const path = require("node:path");

const apiBaseUrl = (
  process.env.OPHELIA_API_BASE_URL ||
  process.env.VITE_API_BASE_URL ||
  "http://localhost:5159/api"
).replace(/\/$/, "");

const config = `window.OPHELIA_CONFIG = ${JSON.stringify({ apiBaseUrl }, null, 2)};\n`;
const outputPath = path.join(__dirname, "..", "config.js");

fs.writeFileSync(outputPath, config, "utf8");
console.log(`Wrote config.js with API base URL: ${apiBaseUrl}`);