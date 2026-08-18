declare interface Window {
  __APP_CONFIG__: AppConfig | null;
}

const loginButton = document.getElementById("login-button") as HTMLButtonElement;
const logoutButton = document.getElementById("logout-button") as HTMLButtonElement;
const modeLabel = document.getElementById("mode-label") as HTMLElement;

async function restoreSession(appConfig: AppConfig): Promise<void> {
  const accessToken = sessionStorage.getItem(STORAGE_KEYS.accessToken);
  if (!accessToken) return;

  showStatus("Fetching user information...");
  const userInfo = await requestUserInfo(appConfig, accessToken);
  const expiresIn = sessionStorage.getItem(STORAGE_KEYS.expiresIn);
  setUserInfo(userInfo, accessToken, expiresIn);
  clearStatus();
}

async function initStaticMode(appConfig: AppConfig): Promise<void> {
  modeLabel.textContent = "Running in static mode (GitHub Pages compatible).";
  loginButton.addEventListener("click", () => {
    beginAuthorization(appConfig).catch((err: Error) => showError(err.message));
  });
  logoutButton.addEventListener("click", () => {
    clearSession();
    clearError();
    clearStatus();
  });

  await handleRedirect(appConfig);
  await restoreSession(appConfig);
}

function initServerMode(): void {
  modeLabel.textContent = "Running in server mode (Express backend).";
  loginButton.addEventListener("click", () => {
    window.location.assign("/authorize");
  });

  const params = new URLSearchParams(window.location.search);
  const error = params.get("error");
  if (error) showError(error);
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
  } catch (err) {
    clearStatus();
    showError((err as Error).message || String(err));
  }
})();
