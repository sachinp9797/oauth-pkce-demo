const crypto = require('crypto');

// Generate random alphanumeric string of specified length
function generateRandomString(length) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate PKCE challenge from verifier
function generatePKCEChallenge(verifier) {
  return crypto
    .createHash('sha256')
    .update(verifier)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

// Generate state token for CSRF protection
function generateState() {
  return crypto.randomBytes(32).toString('hex');
}

const express = require('express');
const session = require('express-session');
const axios = require('axios');
const config = require('./config');

const app = express();

// Middleware
app.use(session({
  secret: config.sessionSecret,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }, // set true in production with https
}));

app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));

// Routes

// GET / - Home page
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

// GET /authorize - Initiate OAuth authorization
app.get('/authorize', (req, res) => {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = generatePKCEChallenge(codeVerifier);
  const state = generateState();

  // Store in session
  req.session.codeVerifier = codeVerifier;
  req.session.state = state;

  // Build authorization URL
  const authorizeUrl = new URL(config.xola.authorizeUrl);
  authorizeUrl.searchParams.append('client_id', config.oauth.clientId);
  authorizeUrl.searchParams.append('redirect_uri', config.redirectUri);
  authorizeUrl.searchParams.append('response_type', 'code');
  authorizeUrl.searchParams.append('code_challenge', codeChallenge);
  authorizeUrl.searchParams.append('code_challenge_method', 'S256');
  authorizeUrl.searchParams.append('state', state);

  res.redirect(authorizeUrl.toString());
});

// GET /callback - Handle OAuth redirect
app.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  // Validate state (CSRF protection)
  if (state !== req.session.state) {
    return res.status(400).send('State mismatch. Possible CSRF attack.');
  }

  if (!code) {
    return res.status(400).send('No authorization code received.');
  }

  const codeVerifier = req.session.codeVerifier;
  if (!codeVerifier) {
    return res.status(400).send('Code verifier not found in session.');
  }

  try {
    // Exchange code for token
    const tokenResponse = await axios.post(config.xola.tokenUrl, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: config.redirectUri,
      client_id: config.oauth.clientId,
      client_secret: config.oauth.clientSecret,
      code_verifier: codeVerifier,
    });

    // Store tokens in session
    req.session.accessToken = tokenResponse.data.access_token;
    req.session.refreshToken = tokenResponse.data.refresh_token || null;
    req.session.expiresIn = tokenResponse.data.expires_in;

    res.redirect('/dashboard');
  } catch (error) {
    console.error('Token exchange failed:', error.response?.data || error.message);
    res.redirect(`/?error=Token exchange failed: ${error.message}`);
  }
});

// GET /dashboard - Display authenticated user info
app.get('/dashboard', async (req, res) => {
  if (!req.session.accessToken) {
    return res.redirect('/?error=No access token. Please log in.');
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
              <dd>${escapeHtml(userInfo.userId)}</dd>
              <dt>Seller ID</dt>
              <dd>${escapeHtml(userInfo.sellerId)}</dd>
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
    console.error('Userinfo fetch failed:', error.response?.data || error.message);
    res.redirect('/?error=Failed to fetch user info');
  }
});

// GET /logout - Clear session
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Logout failed');
    }
    res.redirect('/');
  });
});

// Helper to escape HTML
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Start server
app.listen(config.port, () => {
  console.log(`OAuth Sample App listening on http://localhost:${config.port}`);
});
