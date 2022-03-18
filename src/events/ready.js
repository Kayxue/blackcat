import log from "../logger.js";

export default {
  event: "ready",
  once: false,
  run: async (client) => {
    log.info(`${client.user.username} 已上線`);
    
    client.user.setPresence({
      status: "dnd",
      activities: [{
        name: "/help | catmusic.ml",
        type: "LISTENING"
      }]
    });
    setInterval(() => {
      client.user.setPresence({
        status: "dnd",
        activities: [{
          name: "/help | catmusic.ml",
          type: "LISTENING"
        }]
      });
    }, 60_000);
  },
};
