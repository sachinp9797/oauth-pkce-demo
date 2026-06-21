require("dotenv").config();

const cimdMode = !!process.env.NGROK_URL;
const ngrokUrl = (process.env.NGROK_URL || "").replace(/\/$/, "");

const config = {
  port: process.env.PORT || 8080,
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
  redirectUri: process.env.REDIRECT_URI || "http://localhost:8080/callback",

  oauth: {
    clientId: cimdMode
      ? `${ngrokUrl}/.well-known/oauth-client-metadata`
      : process.env.OAUTH_CLIENT_ID,
    authorizeUrl:
      process.env.OAUTH_AUTHORIZE_URL || "http://localhost/api/oauth/login",
    tokenUrl: process.env.OAUTH_TOKEN_URL || "http://localhost/api/token",
    userInfoUrl:
      process.env.OAUTH_USERINFO_URL || "http://localhost/api/users/me",
  },

  cimd: {
    enabled: cimdMode,
    metadataUrl: cimdMode
      ? `${ngrokUrl}/.well-known/oauth-client-metadata`
      : null,
  },
};

if (!cimdMode && !config.oauth.clientId) {
  console.error(
    "ERROR: set NGROK_URL for CIMD mode, or OAUTH_CLIENT_ID for static mode",
  );
  process.exit(1);
}

module.exports = config;
