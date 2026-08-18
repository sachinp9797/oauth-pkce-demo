import { Router, Request, Response } from "express";
import config from "../config";

const router = Router();

router.get("/runtime-config.js", (req: Request, res: Response) => {
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

export default router;
