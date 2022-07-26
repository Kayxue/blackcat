import { ShardingManager } from "discord.js";
import dotenv from "dotenv";
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
