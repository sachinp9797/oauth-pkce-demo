interface AppConfig {
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  redirectUri?: string;
}

interface TokenResponse {
  access_token: string;
  expires_in?: number;
}

interface UserInfo {
  id?: string;
  email?: string;
  name?: string;
}

function getRedirectUri(appConfig: AppConfig): string {
  if (appConfig.redirectUri) return appConfig.redirectUri;
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/index\.html$/, "");
  return url.toString();
}

async function requestToken(
  appConfig: AppConfig,
  code: string,
  codeVerifier: string,
): Promise<TokenResponse> {
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(appConfig),
    client_id: appConfig.clientId,
    code_verifier: codeVerifier,
  });

  const res = await fetch(appConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`Token exchange failed (${res.status}): ${details}`);
  }

  return res.json();
}

async function requestUserInfo(
  appConfig: AppConfig,
  accessToken: string,
): Promise<UserInfo> {
  const res = await fetch(appConfig.userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const details = await res.text();
    throw new Error(`User info fetch failed (${res.status}): ${details}`);
  }

  return res.json();
}

async function beginAuthorization(appConfig: AppConfig): Promise<void> {
  const codeVerifier = randomString(64);
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = randomString(64);

  sessionStorage.setItem(STORAGE_KEYS.verifier, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.state, state);

  const authorizeUrl = new URL(appConfig.authorizeUrl);
  authorizeUrl.searchParams.set("client_id", appConfig.clientId);
  authorizeUrl.searchParams.set("redirect_uri", getRedirectUri(appConfig));
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("code_challenge", codeChallenge);
  authorizeUrl.searchParams.set("code_challenge_method", "S256");
  authorizeUrl.searchParams.set("state", state);

  window.location.assign(authorizeUrl.toString());
}

async function handleRedirect(appConfig: AppConfig): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("error");
  if (authError) throw new Error(authError);

  const code = params.get("code");
  if (!code) return;

  const expectedState = sessionStorage.getItem(STORAGE_KEYS.state);
  const state = params.get("state");
  if (!state || state !== expectedState) {
    throw new Error("State mismatch. Possible CSRF attack.");
  }

  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.verifier);
  if (!codeVerifier) throw new Error("Code verifier not found in session storage.");

  showStatus("Exchanging authorization code for token...");
  const tokenData = await requestToken(appConfig, code, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.accessToken, tokenData.access_token);
  sessionStorage.setItem(STORAGE_KEYS.expiresIn, String(tokenData.expires_in || ""));
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  sessionStorage.removeItem(STORAGE_KEYS.state);

  window.history.replaceState({}, document.title, getRedirectUri(appConfig));
}
