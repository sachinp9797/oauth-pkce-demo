const STORAGE_KEYS = {
  verifier: "oauth_code_verifier",
  state: "oauth_state",
  accessToken: "oauth_access_token",
  expiresIn: "oauth_expires_in",
};

const loginButton = document.getElementById("login-button");
const logoutButton = document.getElementById("logout-button");
const dashboardCard = document.getElementById("dashboard-card");
const errorMessage = document.getElementById("error-message");
const statusMessage = document.getElementById("status-message");
const modeLabel = document.getElementById("mode-label");

function getRedirectUri(appConfig) {
  if (appConfig.redirectUri) {
    return appConfig.redirectUri;
  }
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.pathname = url.pathname.replace(/index\.html$/, "");
  return url.toString();
}

function randomString(length) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const buffer = new Uint8Array(length);
  crypto.getRandomValues(buffer);
  return Array.from(buffer, (b) => chars[b % chars.length]).join("");
}

function base64UrlEncode(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(hash);
}

function showError(message) {
  errorMessage.textContent = `Error: ${message}`;
  errorMessage.style.display = "block";
}

function clearError() {
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

function showStatus(message) {
  statusMessage.textContent = message;
  statusMessage.style.display = "block";
}

function clearStatus() {
  statusMessage.textContent = "";
  statusMessage.style.display = "none";
}

function setUserInfo(userInfo, token, expiresIn) {
  document.getElementById("user-id").textContent = userInfo.id || "-";
  document.getElementById("user-email").textContent = userInfo.email || "-";
  document.getElementById("user-name").textContent = userInfo.name || "-";
  document.getElementById("access-token").textContent = token || "-";
  document.getElementById("expires-in").textContent = expiresIn
    ? `${expiresIn} seconds`
    : "-";
  dashboardCard.style.display = "block";
}

function clearSession() {
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  sessionStorage.removeItem(STORAGE_KEYS.state);
  sessionStorage.removeItem(STORAGE_KEYS.accessToken);
  sessionStorage.removeItem(STORAGE_KEYS.expiresIn);
  dashboardCard.style.display = "none";
}

async function requestToken(appConfig, code, codeVerifier) {
  const payload = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: getRedirectUri(appConfig),
    client_id: appConfig.clientId,
    code_verifier: codeVerifier,
  });

  const tokenResponse = await fetch(appConfig.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: payload,
  });

  if (!tokenResponse.ok) {
    const details = await tokenResponse.text();
    throw new Error(`Token exchange failed (${tokenResponse.status}): ${details}`);
  }

  return tokenResponse.json();
}

async function requestUserInfo(appConfig, accessToken) {
  const userResponse = await fetch(appConfig.userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!userResponse.ok) {
    const details = await userResponse.text();
    throw new Error(`User info fetch failed (${userResponse.status}): ${details}`);
  }

  return userResponse.json();
}

async function beginAuthorization(appConfig) {
  clearError();
  clearStatus();

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

async function handleRedirect(appConfig) {
  const params = new URLSearchParams(window.location.search);
  const authError = params.get("error");
  if (authError) {
    throw new Error(authError);
  }

  const code = params.get("code");
  if (!code) {
    return;
  }

  const expectedState = sessionStorage.getItem(STORAGE_KEYS.state);
  const state = params.get("state");
  if (!state || state !== expectedState) {
    throw new Error("State mismatch. Possible CSRF attack.");
  }

  const codeVerifier = sessionStorage.getItem(STORAGE_KEYS.verifier);
  if (!codeVerifier) {
    throw new Error("Code verifier not found in session storage.");
  }

  showStatus("Exchanging authorization code for token...");
  const tokenData = await requestToken(appConfig, code, codeVerifier);
  sessionStorage.setItem(STORAGE_KEYS.accessToken, tokenData.access_token);
  sessionStorage.setItem(STORAGE_KEYS.expiresIn, String(tokenData.expires_in || ""));
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  sessionStorage.removeItem(STORAGE_KEYS.state);

  const redirectUri = getRedirectUri(appConfig);
  window.history.replaceState({}, document.title, redirectUri);
}

async function restoreSession(appConfig) {
  const accessToken = sessionStorage.getItem(STORAGE_KEYS.accessToken);
  if (!accessToken) {
    return;
  }

  showStatus("Fetching user information...");
  const userInfo = await requestUserInfo(appConfig, accessToken);
  const expiresIn = sessionStorage.getItem(STORAGE_KEYS.expiresIn);
  setUserInfo(userInfo, accessToken, expiresIn);
  clearStatus();
}

function initServerMode() {
  modeLabel.textContent = "Server mode detected (Express backend routes).";
  loginButton.addEventListener("click", () => {
    window.location.assign("/authorize");
  });

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (error) {
    showError(error);
  }
}

async function initStaticMode(appConfig) {
  modeLabel.textContent = "Static mode enabled (GitHub Pages compatible).";
  loginButton.addEventListener("click", () => {
    beginAuthorization(appConfig).catch((error) => showError(error.message));
  });
  logoutButton.addEventListener("click", () => {
    clearSession();
    clearError();
    clearStatus();
  });

  await handleRedirect(appConfig);
  await restoreSession(appConfig);
}

(async () => {
  try {
    const appConfig = window.__APP_CONFIG__;
    if (
      !appConfig ||
      !appConfig.clientId ||
      !appConfig.authorizeUrl ||
      !appConfig.tokenUrl ||
      !appConfig.userInfoUrl
    ) {
      initServerMode();
      return;
    }

    await initStaticMode(appConfig);
  } catch (error) {
    clearStatus();
    showError(error.message || String(error));
  }
})();
