import { ClusterManager } from "discord-hybrid-sharding";
import dotenv from "dotenv";
import log from "./logger.js";
import configReslover from "./util/configReslover.js";

dotenv.config();
const config = await configReslover();

const manager = new ClusterManager("./src/instance.js", {
  totalShards: "auto",
  token: config.token,
});

if (config.enableDev) {
  manager.on("debug", log.debug);
}

manager.on("shardCreate", (shard) => {
  log.info(`已啟動分片 ${shard.id}`, "分片");
});

manager.spawn();
