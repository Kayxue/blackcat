import PlayerManager from "../audio/PlayerManager.js";

export default {
  event: "guildDelete",
  once: false,
  run: (guild) => {
    if (PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)) {
      let player = PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id);
    }
  },
};
