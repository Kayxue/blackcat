import log from "../logger.js";

export default {
  event: "shardReady",
  once: false,
  run: async (_client, id) => {
    log.info(`分片 ${id} 已上線`, "分片");
  },
};
