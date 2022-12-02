import log from "../logger.js";

export default {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`, "系統");
    let commands = client.commands.map((e) => e.data);
    let registered;
    log.info("正在同步指令...", "指令");
    try {
      if (client.config.enableDev)
        log.info("開發者模式已開啟", "啟動");
      registered = await client.application?.commands.set(
        commands,
        client.config.enableDev ? client.config.devGuild : undefined,
      );
    } catch (e) {
      log.error(`同步指令時發生錯誤: ${e.message}`, e, "指令");
      return;
    }
    log.info(`同步指令成功: ${registered.size}`, "指令");

    client.user.setPresence({
      status: "dnd",
      activities: [
        {
          name: "/help ┃ catmusic.ml",
          type: "LISTENING",
        },
      ],
    });
    setInterval(() => {
      client.user.setPresence({
        status: "dnd",
        activities: [
          {
            name: "/help ┃ catmusic.ml",
            type: "LISTENING",
          },
        ],
      });
    }, 20_000);
  },
};
