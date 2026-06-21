const express = require("express");
const config = require("./config");
const staticRoutes = require("./routes/static");
const cimdRoutes = require("./routes/cimd");

const app = express();

app.set("trust proxy", 1);
app.use(express.urlencoded({ extended: false }));
app.use(staticRoutes);
app.use(cimdRoutes);
app.use(express.static("public"));

app.get("/", (req, res) => res.sendFile(__dirname + "/public/index.html"));
app.get("/callback", (req, res) => res.sendFile(__dirname + "/public/index.html"));

if (require.main === module) {
  app.listen(config.port, () => {
    console.log(`OAuth PKCE Demo listening on http://localhost:${config.port}`);
  });
}

module.exports = app;
