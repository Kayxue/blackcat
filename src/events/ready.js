import log from "../logger.js";

export default {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`, "系統");
    const commands = client.commands.map((e) => e.data);
    let registered;
    log.info("正在同步指令...", "指令");
    try {
      registered = await client.application?.commands.set(commands);
    } catch (e) {
      log.error(`同步指令時發生錯誤: ${e.message}`, e, "指令");
      return;
    }
    log.info(`同步指令成功: ${registered.size}`, "指令");

    client.user.setPresence({
      status: "dnd",
      activities: [
        {
          name: "/help | Black cat",
          type: "LISTENING",
        },
      ],
    });
    setInterval(() => {
      client.user.setPresence({
        status: "dnd",
        activities: [
          {
            name: "/help | Black cat",
            type: "LISTENING",
          },
        ],
      });
    }, 20_000);
  },
};
