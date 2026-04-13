require('dotenv').config();

const config = {
  port: process.env.PORT || 8080,
  sessionSecret: process.env.SESSION_SECRET || 'dev-secret-change-in-prod',
  redirectUri: process.env.REDIRECT_URI || 'http://localhost:8080/callback',

  xola: {
    baseUrl: process.env.XOLA_URL || 'http://localhost',
    authorizeUrl: process.env.XOLA_OAUTH_AUTHORIZE_URL || 'http://localhost/oauth/login',
    tokenUrl: process.env.XOLA_OAUTH_TOKEN_URL || 'http://localhost/oauth2/token',
    userInfoUrl: process.env.XOLA_OAUTH_USERINFO_URL || 'http://localhost/api/oauth/userinfo',
  },

  oauth: {
    clientId: process.env.OAUTH_CLIENT_ID,
    clientSecret: process.env.OAUTH_CLIENT_SECRET,
  },
};

// Validate required env vars
if (!config.oauth.clientId || !config.oauth.clientSecret) {
  console.error('ERROR: OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET must be set in .env');
  process.exit(1);
}

module.exports = config;
