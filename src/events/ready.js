const slash = require("../util/slashRegister.js");
const log = require("../logger.js");

module.exports = {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`);
    const commands = client.commands.map((e) => e.data.toJSON());
    slash.register(client, commands);
  },
};