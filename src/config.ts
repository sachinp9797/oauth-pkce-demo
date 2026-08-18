import dotenv from "dotenv";
dotenv.config();

const cimdMode = !!process.env.NGROK_URL;
const ngrokUrl = (process.env.NGROK_URL || "").replace(/\/$/, "");

export interface Config {
  port: number | string;
  sessionSecret: string;
  redirectUri: string;
  oauth: {
    clientId: string | undefined;
    authorizeUrl: string;
    tokenUrl: string;
    userInfoUrl: string;
  };
  cimd: {
    enabled: boolean;
    metadataUrl: string | null;
  };
}

const config: Config = {
  port: process.env.PORT || 8080,
  sessionSecret: process.env.SESSION_SECRET || "dev-secret-change-in-prod",
  redirectUri: process.env.REDIRECT_URI || "http://localhost:8080/callback",

  oauth: {
    clientId: cimdMode
      ? `${ngrokUrl}/.well-known/oauth-client-metadata`
      : process.env.OAUTH_CLIENT_ID,
    authorizeUrl:
      process.env.OAUTH_AUTHORIZE_URL || "https://staging.xola.com/api/authorize",
    tokenUrl:
      process.env.OAUTH_TOKEN_URL || "https://staging.xola.com/api/token",
    userInfoUrl:
      process.env.OAUTH_USERINFO_URL || "https://staging.xola.com/api/users/me",
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

export default config;
