const crypto = require("crypto");

// Generate random alphanumeric string of specified length
function generateRandomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate PKCE challenge from verifier
function generatePKCEChallenge(verifier) {
  return crypto
    .createHash("sha256")
    .update(verifier)
    .digest("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

// Generate state token for CSRF protection
function generateState() {
  return crypto.randomBytes(32).toString("hex");
}

const express = require("express");
const cookieSession = require("cookie-session");
const axios = require("axios");
const config = require("./config");

const app = express();

// Middleware
app.set("trust proxy", 1);
app.use(
  cookieSession({
    name: "oauth_sample_session",
    keys: [config.sessionSecret],
    maxAge: 60 * 60 * 1000,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    httpOnly: true,
  }),
);

app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));

// Routes

// GET /.well-known/oauth-client-metadata - CIMD metadata document
// Xola fetches this URL to discover the client's redirect URIs and capabilities.
app.get("/.well-known/oauth-client-metadata", (req, res) => {
  if (!config.cimd.enabled) {
    return res
      .status(404)
      .json({ error: "CIMD mode not enabled. Set NGROK_URL." });
  }

  res.setHeader("Content-Type", "application/json");
  res.json({
    client_id: config.oauth.clientId,
    client_name: "Xola OAuth Sample App",
    redirect_uris: [config.redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    code_challenge_method: "S256",
  });
});

// GET / - Home page
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// GET /authorize - Initiate OAuth authorization
app.get("/authorize", (req, res) => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generatePKCEChallenge(codeVerifier);
  const state = generateState();

  // Store in session
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  // Build authorization URL
  const authorizeUrl = new URL(config.xola.authorizeUrl);
  authorizeUrl.searchParams.append("client_id", config.oauth.clientId);
  authorizeUrl.searchParams.append("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.append("response_type", "code");
  authorizeUrl.searchParams.append("code_challenge", codeChallenge);
  authorizeUrl.searchParams.append("code_challenge_method", "S256");
  authorizeUrl.searchParams.append("state", state);

  if (config.cimd.enabled) {
    console.log(`[CIMD] client_id: ${config.oauth.clientId}`);
  }

  res.redirect(authorizeUrl.toString());
});

// GET /callback - Handle OAuth redirect
app.get("/callback", async (req, res) => {
  const { code, state } = req.query;

  // Validate state (CSRF protection)
  if (state !== req.session.state) {
    return res.status(400).send("State mismatch. Possible CSRF attack.");
  }

  if (!code) {
    return res.status(400).send("No authorization code received.");
  }

  const codeVerifier = req.session.codeVerifier;
  if (!codeVerifier) {
    return res.status(400).send("Code verifier not found in session.");
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(
      config.xola.tokenUrl,
      new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        client_id: config.oauth.clientId,
        code_verifier: codeVerifier,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } },
    );

    // Store tokens in session
    req.session.accessToken = tokenResponse.data.access_token;
    req.session.expiresIn = tokenResponse.data.expires_in;
    req.session.codeVerifier = null;
    req.session.state = null;

    res.redirect("/dashboard");
  } catch (error) {
    console.error(
      "Token exchange failed:",
      JSON.stringify(error.response?.data || error.message),
    );
    res.redirect(`/?error=Token exchange failed: ${error.message}`);
  }
});

// GET /dashboard - Display authenticated user info
app.get("/dashboard", async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect("/?error=No access token. Please log in.");
  }

  try {
    // Fetch userinfo
    const userInfoResponse = await axios.get(config.xola.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${req.session.accessToken}`,
      },
    });

    const userInfo = userInfoResponse.data;

    // Build HTML response
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Dashboard - OAuth Sample App</title>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div class="container">
          <h1>🎉 Authenticated!</h1>
          <p>You have successfully authenticated with Xola's OAuth server.</p>

          <div class="card">
            <h2>User Information</h2>
            <dl>
              <dt>User ID</dt>
              <dd>${escapeHtml(userInfo.id)}</dd>
              <dt>Email</dt>
              <dd>${escapeHtml(userInfo.email)}</dd>
              <dt>Name</dt>
              <dd>${escapeHtml(userInfo.name)}</dd>

            </dl>
          </div>

          <div class="card">
            <h2>Token Details</h2>
            <dl>
              <dt>Access Token</dt>
              <dd><code>${escapeHtml(req.session.accessToken.substring(0, 50))}...</code></dd>
              <dt>Token Type</dt>
              <dd>Bearer</dd>
              <dt>Expires In</dt>
              <dd>${req.session.expiresIn} seconds</dd>
            </dl>
          </div>

          <div class="card">
            <h2>Actions</h2>
            <a href="/logout" class="btn btn-danger">Logout</a>
          </div>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (error) {
    console.error(
      "Userinfo fetch failed:",
      error.response?.data || error.message,
    );
    res.redirect("/?error=Failed to fetch user info");
  }
});

// GET /logout - Clear session
app.get("/logout", (req, res) => {
  req.session = null;
  res.redirect("/");
});

// Helper to escape HTML
function escapeHtml(text) {
  const value = text == null ? "" : String(text);
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return value.replace(/[&<>"']/g, (m) => map[m]);
}

if (require.main === module) {
  // Start server for local development.
  app.listen(config.port, () => {
    console.log(`OAuth Sample App listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
