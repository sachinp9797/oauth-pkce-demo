import { Router, Request, Response } from "express";
import config from "../config";

const router = Router();

router.get("/.well-known/oauth-client-metadata", (req: Request, res: Response) => {
  if (!config.cimd.enabled) {
    res.status(404).json({ error: "CIMD not enabled. Set NGROK_URL." });
    return;
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

export default router;
