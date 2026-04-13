# Xola OAuth Sample App

A Node.js/Express sample OAuth2 client demonstrating the authorization code flow with PKCE against Xola's OAuth server.

## Features

- ✅ OAuth2 authorization code flow
- ✅ PKCE (Proof Key for Code Exchange) support
- ✅ CSRF protection with state parameter
- ✅ Session-based token storage
- ✅ Userinfo endpoint integration
- ✅ Clean, minimal UI

## Prerequisites

- Node.js 16+ and npm
- A running Xola instance with OAuth endpoints
- Registered OAuth client credentials

## Quick Start

### 1. Register an OAuth Client with Xola

First, register a client with Xola's OAuth server. You'll need a seller account on Xola with valid credentials.

```bash
curl -X POST http://localhost/api/oauth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "client_name": "Sample App",
    "redirect_uris": ["http://localhost:8080/callback"],
    "grant_types": ["authorization_code", "refresh_token"]
  }'
```

The response will contain your `client_id` and `client_secret`. Save these.

**Example Response:**
```json
{
  "client_id": "a1b2c3d4e5f6g7h8",
  "client_secret": "i9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b",
  "client_name": "Sample App",
  "redirect_uris": ["http://localhost:8080/callback"],
  "grant_types": ["authorization_code", "refresh_token"]
}
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Copy the example config and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your client credentials:

```env
OAUTH_CLIENT_ID=a1b2c3d4e5f6g7h8
OAUTH_CLIENT_SECRET=i9j8k7l6m5n4o3p2q1r0s9t8u7v6w5x4y3z2a1b
SESSION_SECRET=mysupersecretkey123456789
XOLA_URL=http://localhost
PORT=8080
```

### 4. Start the Server

```bash
npm start
```

The app will start on `http://localhost:8080`.

### 5. Test the OAuth Flow

1. Open http://localhost:8080 in your browser
2. Click "Login with Xola"
3. You'll be redirected to Xola's login page
4. Log in with your seller account credentials
5. You'll be automatically redirected back to the sample app with an access token
6. The dashboard will display your user information

## How It Works

### OAuth2 Authorization Code Flow with PKCE

```
┌─────────────┐                                ┌─────────────┐
│   Sample    │                                │    Xola     │
│     App     │                                │   OAuth     │
│             │                                │   Server    │
└─────────────┘                                └─────────────┘
      │                                               │
      │  1. Generate PKCE challenge                  │
      │  2. Redirect to /oauth/login                 │
      ├──────────────────────────────────────────────>
      │                                               │
      │                                  3. User logs in
      │                                  4. Auto-approve
      │  5. Redirect with code           │
      │  <──────────────────────────────┤
      │                                               │
      │  6. Exchange code for token                  │
      ├──────────────────────────────────────────────>
      │     (client_id, code_verifier)              │
      │                                               │
      │  7. Return access_token          │
      │  <──────────────────────────────┤
      │                                               │
      │  8. Fetch userinfo with token               │
      ├──────────────────────────────────────────────>
      │                                               │
      │  9. Return userinfo              │
      │  <──────────────────────────────┤
      │                                               │
```

### Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/` | GET | Home page with login button |
| `/authorize` | GET | Initiate OAuth authorization (generates PKCE challenge) |
| `/callback` | GET | Handle redirect from Xola (exchange code for token) |
| `/dashboard` | GET | Display authenticated user info |
| `/logout` | GET | Clear session and return to home |

### Session Data

The app stores the following in server-side session:

- `codeVerifier` — PKCE code verifier (for token exchange)
- `state` — CSRF token (validated in callback)
- `accessToken` — OAuth access token
- `refreshToken` — OAuth refresh token (if available)
- `expiresIn` — Token expiration time in seconds

## Security Features

### PKCE (Proof Key for Code Exchange)

Prevents authorization code interception attacks:
- App generates a random `code_verifier` (64 chars)
- Computes `code_challenge = base64url(sha256(code_verifier))`
- Sends `code_challenge` to authorization endpoint
- Validates by sending `code_verifier` during token exchange

### CSRF Protection

Prevents cross-site request forgery:
- App generates random `state` token
- Sends `state` to authorization endpoint
- Validates `state` in callback before processing

### Secure Token Storage

- Tokens stored server-side in session only
- Never exposed to client-side JavaScript
- Session cookie marked as HTTP-only (in production)

## Testing Scenarios

### Successful Login
1. Have a valid Xola seller account
2. Use correct email and password at login page
3. Authorization auto-approved
4. Dashboard shows user info

### Invalid Credentials
1. Enter wrong email or password at Xola login
2. Xola login page shows error
3. Click "Back" or "Login again" to retry

### Token Validation
1. After successful login, dashboard calls `/api/oauth/userinfo`
2. If token is valid, userinfo is displayed
3. If token is expired/invalid, redirect to home with error

### PKCE Verification
1. Check Network tab in browser DevTools
2. First request to `/authorize` generates PKCE
3. Callback to Xola includes `code_challenge` in URL
4. Token exchange includes `code_verifier` in POST body

## Troubleshooting

### "OAUTH_CLIENT_ID and OAUTH_CLIENT_SECRET must be set"
- Make sure you've created `.env` from `.env.example`
- Verify both variables are populated
- Restart the server after changes

### "State mismatch. Possible CSRF attack."
- Session cookie may have been cleared
- Try logging out and logging back in
- Check browser DevTools for session cookie

### "Token exchange failed"
- Check that Xola's `/oauth2/token` endpoint is accessible
- Verify client credentials in `.env` are correct
- Check Xola's logs for more details

### "Failed to fetch user info"
- Token may be expired
- Xola's `/api/oauth/userinfo` endpoint may be down
- Check browser DevTools Network tab for exact error

## Future Enhancements

- Token refresh flow (use refresh token to get new access token)
- Scope-based permission requests and display
- Multiple account switching
- Token revocation endpoint
- API call examples (fetch user profile, list sellers, etc.)

## References

- [OAuth 2.0 Authorization Code Grant](https://tools.ietf.org/html/rfc6749#section-1.3.1)
- [PKCE (RFC 7636)](https://tools.ietf.org/html/rfc7636)
- [Express.js Documentation](https://expressjs.com/)
- [Xola API Documentation](https://api.xola.com/)

## License

MIT
