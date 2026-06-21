const errorMessage = document.getElementById("error-message");
const statusMessage = document.getElementById("status-message");
const dashboardCard = document.getElementById("dashboard-card");

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
