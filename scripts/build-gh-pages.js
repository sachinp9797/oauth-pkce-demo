const fs = require("fs");
const path = require("path");
require("dotenv").config();

const rootDir = path.resolve(__dirname, "..");
const publicDir = path.join(rootDir, "public");
const distDir = path.join(rootDir, "dist");

function normalizeBaseUrl(baseUrl) {
  if (!baseUrl) return "";
  return baseUrl.replace(/\/+$/, "");
}

const clientId = process.env.OAUTH_CLIENT_ID;
if (!clientId) {
  throw new Error("OAUTH_CLIENT_ID is required to build for GitHub Pages");
}

const publicBaseUrl = normalizeBaseUrl(process.env.PUBLIC_BASE_URL || "");
const config = {
  clientId,
  authorizeUrl:
    process.env.OAUTH_AUTHORIZE_URL ||
    "https://your-provider.example.com/oauth/authorize",
  tokenUrl:
    process.env.OAUTH_TOKEN_URL ||
    "https://your-provider.example.com/oauth/token",
  userInfoUrl:
    process.env.OAUTH_USERINFO_URL ||
    "https://your-provider.example.com/oauth/userinfo",
  redirectUri:
    process.env.REDIRECT_URI || (publicBaseUrl ? `${publicBaseUrl}/` : ""),
};

if (!config.redirectUri) {
  throw new Error("Set REDIRECT_URI or PUBLIC_BASE_URL for GitHub Pages builds");
}

fs.rmSync(distDir, { recursive: true, force: true });
fs.cpSync(publicDir, distDir, { recursive: true });
fs.writeFileSync(
  path.join(distDir, "runtime-config.js"),
  `window.__APP_CONFIG__ = ${JSON.stringify(config, null, 2)};\n`,
  "utf8",
);
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

console.log(`GitHub Pages build ready in ${distDir}`);
