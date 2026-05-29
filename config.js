require("dotenv").config();

// CIMD mode: client_id is the ngrok URL of this app's metadata endpoint.
// Static mode: client_id is a pre-registered string from OAUTH_CLIENT_ID.
const cimdMode = !!process.env.NGROK_URL;
const ngrokUrl = (process.env.NGROK_URL || "").replace(/\/$/, "");

const config = {
  port: process.env.PORT || 8080,
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",

  // In CIMD mode the redirect URI must be under the ngrok domain.
  redirectUri: process.env.REDIRECT_URI || "http://localhost:8080/callback",

  xola: {
    baseUrl: process.env.XOLA_URL || "http://localhost",
    authorizeUrl:
      process.env.XOLA_OAUTH_AUTHORIZE_URL ||
      "http://localhost/api/oauth/login",
    tokenUrl: process.env.XOLA_OAUTH_TOKEN_URL || "http://localhost/api/token",
    userInfoUrl:
      process.env.XOLA_OAUTH_USERINFO_URL || "http://localhost/api/users/me",
  },

  cimd: {
    enabled: cimdMode,
    // The URL Xola fetches to discover this client's metadata.
    metadataUrl: cimdMode
      ? `${ngrokUrl}/.well-known/oauth-client-metadata`
      : null,
  },

  oauth: {
    // In CIMD mode the client_id IS the metadata URL (no pre-registration needed).
    clientId: cimdMode
      ? `${ngrokUrl}/.well-known/oauth-client-metadata`
      : process.env.OAUTH_CLIENT_ID,
  },
};

if (!cimdMode && !config.oauth.clientId) {
  console.error(
    "ERROR: set NGROK_URL for CIMD mode, or OAUTH_CLIENT_ID for static mode",
  );
  process.exit(1);
}

module.exports = config;
