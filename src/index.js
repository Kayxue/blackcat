import { ShardingManager } from "discord.js";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import fs from "node:fs";
import log from "./logger.js";
import configReslover from "./util/configReslover.js";

dotenv.config();
const config = await configReslover();

const manager = new ShardingManager("./src/instance.js", {
  token: config.token,
});

manager.on("shardCreate", (shard) => {
  log.info(`已啟動分片 ${shard.id}`);

  shard.on("ready", () => {
    shard.process.send({
      type: "shardId",
      value: shard.id,
    });
  });
});

manager.spawn();

if (config.enableApi) {
  const http = express();

  http.use(helmet());

  let routeFiles = fs
    .readdirSync("./src/routes/")
    .filter((file) => file.endsWith(".js"));
  routeFiles.forEach(async (route) => {
    let routeFunction = (await import(`./routes/${route}`)).default;
    routeFunction(http);
  });

  http.listen(config.apiPort, () => {
    log.info(`API伺服器已啟動，監聽端口為 ${config.apiPort}`);
  });
}
