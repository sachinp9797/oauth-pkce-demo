const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/.well-known/oauth-client-metadata", (req, res) => {
  if (!config.cimd.enabled) {
    return res.status(404).json({ error: "CIMD not enabled. Set NGROK_URL." });
  }

  res.json({
    client_id: config.oauth.clientId,
    client_name: "OAuth PKCE Demo",
    redirect_uris: [config.redirectUri],
    grant_types: ["authorization_code", "refresh_token"],
    response_types: ["code"],
    token_endpoint_auth_method: "none",
    code_challenge_method: "S256",
  });
});

module.exports = router;
