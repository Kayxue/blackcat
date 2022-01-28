const log = require("../logger.js");

const slash = {
  /**
     *
     * @param {Client} client
     * @param {Collection} commands
     */
  register: async (client, commands) => {
    let registered;
    log.info("正在同步指令...");
    try {
      registered = await client.application?.commands.set(commands);
    } catch (e) {
      log.error(`同步指令時發生錯誤: ${e.message}`);
      return;
    }
    log.info(`同步指令成功: ${registered.size}`);
  }
};

module.exports = slash;