import PlayerManager from "../audio/PlayerManager.js";

export default {
  event: "guildDelete",
  once: false,
  run: (client, guild) => {
    if (PlayerManager.getSendingPlayer(client, guild.id)) {
      const player = PlayerManager.getSendingPlayer(client, guild.id);
      player.stop(null, true);
    }
  },
};
