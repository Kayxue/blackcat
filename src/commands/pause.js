import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
  data: {
    name: "pause",
    description: "暫停目前正在播放的音樂"
  },
  run: function(interaction) {
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道")
          .catch(() => {});
    }
    player.pause(interaction);
  },
};
