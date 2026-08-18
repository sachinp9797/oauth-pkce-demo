const errorMessage = document.getElementById("error-message") as HTMLElement;
const statusMessage = document.getElementById("status-message") as HTMLElement;
const dashboardCard = document.getElementById("dashboard-card") as HTMLElement;

function showError(message: string): void {
  errorMessage.textContent = `Error: ${message}`;
  errorMessage.style.display = "block";
}

function clearError(): void {
  errorMessage.textContent = "";
  errorMessage.style.display = "none";
}

function showStatus(message: string): void {
  statusMessage.textContent = message;
  statusMessage.style.display = "block";
}

function clearStatus(): void {
  statusMessage.textContent = "";
  statusMessage.style.display = "none";
}

function setUserInfo(userInfo: UserInfo, token: string, expiresIn: string | null): void {
  (document.getElementById("user-id") as HTMLElement).textContent = userInfo.id || "-";
  (document.getElementById("user-email") as HTMLElement).textContent = userInfo.email || "-";
  (document.getElementById("user-name") as HTMLElement).textContent = userInfo.name || "-";
  (document.getElementById("access-token") as HTMLElement).textContent = token || "-";
  (document.getElementById("expires-in") as HTMLElement).textContent = expiresIn
    ? `${expiresIn} seconds`
    : "-";
  dashboardCard.style.display = "block";
}

function clearSession(): void {
  sessionStorage.removeItem(STORAGE_KEYS.verifier);
  sessionStorage.removeItem(STORAGE_KEYS.state);
  sessionStorage.removeItem(STORAGE_KEYS.accessToken);
  sessionStorage.removeItem(STORAGE_KEYS.expiresIn);
  dashboardCard.style.display = "none";
}
