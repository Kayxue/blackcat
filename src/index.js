import Cluster from "discord-hybrid-sharding";
import dotenv from "dotenv";
import log from "./logger.js";
import configReslover from "./util/configReslover.js";

dotenv.config();
const config = await configReslover();

const manager = new Cluster.Manager("./src/instance.js", {
  totalShards: "auto",
  token: config.token,
});

manager.on("shardCreate", (shard) => {
  log.info(`已啟動分片 ${shard.id}`);
});

manager.spawn();
