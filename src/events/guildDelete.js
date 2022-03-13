import PlayerManager from "../audio/PlayerManager.js";

export default {
  event: "guildDelete",
  once: false,
  run: (guild) => {
    if (PlayerManager.getSendingPlayer(guild.client, guild.id)) {
      let player = PlayerManager.getSendingPlayer(guild.client, guild.id);
      player.stop(null, true);
    }
  },
};
