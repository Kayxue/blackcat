import log from "../logger.js";

export default {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`);
    let commands = client.commands.map((e) => e.data.toJSON());
    let registered;
    log.info("正在同步指令...");
    try {
      registered = await client.application?.commands.set(commands);
    } catch (e) {
      log.error(`同步指令時發生錯誤: ${e.message}`, e);
      return;
    }
    log.info(`同步指令成功: ${registered.size}`);
  },
};
