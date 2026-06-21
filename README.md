# oauth-pkce-demo

A minimal OAuth 2.0 authorization code flow demo with PKCE. Every network call runs in the browser — open DevTools to watch the full flow in real time.

Works with any RFC 6749-compliant OAuth server (Auth0, Keycloak, Okta, or your own).

## How PKCE works

```
1. App generates a random code_verifier (64 chars)
2. Computes code_challenge = base64url(SHA-256(code_verifier))
3. Sends code_challenge to the authorization endpoint
4. After redirect, exchanges the code + original code_verifier for a token
5. Server verifies SHA-256(code_verifier) == code_challenge
```

This prevents authorization code interception — an attacker who intercepts the code cannot exchange it without the verifier.

## Quick start (local)

**Prerequisites:** Node.js 16+, an OAuth server with an authorization endpoint, token endpoint, and userinfo endpoint.

```bash
git clone https://github.com/<you>/oauth-pkce-demo
cd oauth-pkce-demo
npm install
cp .env.example .env
```

Edit `.env` with your provider's URLs and client ID:

```env
OAUTH_CLIENT_ID=your_client_id
OAUTH_AUTHORIZE_URL=https://your-provider.example.com/oauth/authorize
OAUTH_TOKEN_URL=https://your-provider.example.com/oauth/token
OAUTH_USERINFO_URL=https://your-provider.example.com/oauth/userinfo
REDIRECT_URI=http://localhost:8080/callback
```

```bash
npm start
```

Open http://localhost:8080, click **Sign in**, and watch the flow in DevTools → Network.

## Provider examples

**Auth0:**
```env
OAUTH_AUTHORIZE_URL=https://<tenant>.auth0.com/authorize
OAUTH_TOKEN_URL=https://<tenant>.auth0.com/oauth/token
OAUTH_USERINFO_URL=https://<tenant>.auth0.com/userinfo
```

**Keycloak:**
```env
OAUTH_AUTHORIZE_URL=https://<host>/realms/<realm>/protocol/openid-connect/auth
OAUTH_TOKEN_URL=https://<host>/realms/<realm>/protocol/openid-connect/token
OAUTH_USERINFO_URL=https://<host>/realms/<realm>/protocol/openid-connect/userinfo
```

**Okta:**
```env
OAUTH_AUTHORIZE_URL=https://<tenant>.okta.com/oauth2/default/v1/authorize
OAUTH_TOKEN_URL=https://<tenant>.okta.com/oauth2/default/v1/token
OAUTH_USERINFO_URL=https://<tenant>.okta.com/oauth2/default/v1/userinfo
```

## Deploy on GitHub Pages (static mode)

GitHub Pages serves static files only — no Express server. The app handles the full OAuth flow in the browser.

1. Set env vars (from `.env` or shell):
   - `OAUTH_CLIENT_ID`
   - `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL`, `OAUTH_USERINFO_URL`
   - `PUBLIC_BASE_URL=https://<username>.github.io/<repo>`
2. Register the redirect URI with your provider: `https://<username>.github.io/<repo>/`
3. Build and deploy:

```bash
npm run build:gh-pages
npm run deploy:gh-pages
```

## Deploy on Vercel (server mode)

1. Push to GitHub and import the repo in Vercel.
2. Add env vars in Vercel Project Settings:
   - `OAUTH_CLIENT_ID`
   - `OAUTH_AUTHORIZE_URL`, `OAUTH_TOKEN_URL`, `OAUTH_USERINFO_URL`
   - `REDIRECT_URI=https://<your-vercel-domain>/callback`
   - `SESSION_SECRET` (any random string)
3. Redeploy after saving.

## CIMD mode (Client Initiated Metadata Discovery)

CIMD lets you skip pre-registering a `client_id`. Instead, the client exposes a metadata document at a public URL, and the authorization server fetches it to discover the redirect URIs.

**Requirements:** A publicly reachable URL for this app (e.g. an ngrok tunnel).

```bash
# Install ngrok, then:
ngrok http 8080
```

Set `NGROK_URL` in `.env`:

```env
NGROK_URL=https://abc123.ngrok-free.app
# OAUTH_CLIENT_ID is ignored in CIMD mode
```

The app serves `/.well-known/oauth-client-metadata` automatically. Your OAuth server uses the metadata URL as the `client_id`.

## Security features

- **PKCE** — prevents authorization code interception (RFC 7636)
- **State parameter** — CSRF protection; validated on callback
- **Client-side token exchange** — intentional: keeps every call visible in DevTools for learning

## Project structure

```
server.js                   # Express entry point
config.js                   # Env → config
routes/
  static.js                 # /runtime-config.js endpoint
  cimd.js                   # /.well-known/oauth-client-metadata
public/
  index.html
  style.css
  runtime-config.js         # Placeholder (replaced at runtime or build time)
  js/
    pkce.js                 # PKCE crypto helpers
    oauth.js                # Authorization + token + userinfo
    ui.js                   # DOM helpers
    app.js                  # Entry point, wires everything
scripts/
  build-gh-pages.js         # Static build for GitHub Pages
```

## License

MIT
