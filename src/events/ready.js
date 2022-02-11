import slash from "../util/slashRegister.js";
import log from "../logger.js";

export default {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`);
    const commands = client.commands.map((e) => e.data.toJSON());
    slash.register(client, commands);
  },
};