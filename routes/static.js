const express = require("express");
const config = require("../config");

const router = express.Router();

router.get("/runtime-config.js", (req, res) => {
  res.setHeader("Content-Type", "application/javascript");
  res.send(
    `window.__APP_CONFIG__ = ${JSON.stringify({
      clientId: config.oauth.clientId,
      authorizeUrl: config.oauth.authorizeUrl,
      tokenUrl: config.oauth.tokenUrl,
      userInfoUrl: config.oauth.userInfoUrl,
      redirectUri: config.redirectUri,
    })};`,
  );
});

module.exports = router;
