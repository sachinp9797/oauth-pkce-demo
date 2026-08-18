import express from "express";
import path from "path";
import config from "./config";
import staticRoutes from "./routes/static";
import cimdRoutes from "./routes/cimd";

const app = express();

app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: false }));
app.use(staticRoutes);
app.use(cimdRoutes);
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));
app.get("/callback", (req, res) => res.sendFile(path.join(__dirname, "../public/index.html")));

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`OAuth PKCE Demo listening on http://localhost:${config.port}`);
  });
}

export default app;
