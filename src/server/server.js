import express from "express";
import ws from "express-ws";
import fs from "node:fs";
import logger from "../logger.js";
import configReslover from "../util/configReslover.js";

export default async function (manager) {
  const config = await configReslover();

  let success = fs.readFileSync("./src/public/200.html", "utf8");
  let notfound = fs.readFileSync("./src/public/404.html", "utf8");
  let error = fs.readFileSync("./src/public/500.html", "utf8");

  const app = express();
  ws(app);

  app.use((_req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    next();
  });

  app.get("/", (req, res) => {
    res.format({
      html: function () {
        res.send(success);
      },
      json: function () {
        res.json({ result: "200 Success" });
      },
      default: function () {
        res.type("txt").send("200 Success");
      },
    });
  });

  /*app.get("/playing/:id", async (req, res) => {
    const id = req.params.id;

    let selected = (
      await manager.fetchClientValues("guilds.cache.get('id')")
    ).filter((i) => i)[0];
    if (!selected) {
      res.json({ success: false });
      return;
    }
  });*/

  app.use((_req, res) => {
    res.format({
      html: function () {
        res.send(notfound);
      },
      json: function () {
        res.json({ result: "404 Not Found" });
      },
      default: function () {
        res.type("txt").send("404 Not Found");
      },
    });
  });

  app.listen(config.apiPort, () => {
    logger.info(`API伺服器已啟動，監聽端口為 ${config.apiPort}`);
  });
}
