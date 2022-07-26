import { EmbedBuilder } from "discord.js";
import { danger } from "../color.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";

export default {
  data: {
    name: "resume",
    description: "繼續播放音樂",
  },
  run: function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction.reply("❌ ┃ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(interaction.guild.id);
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    if (!player.paused) {
      let pausedEmbed = new EmbedBuilder()
        .setTitle("▶️ ┃ 音樂已經在播放了")
        .setDescription("輸入`/pause`來暫停音樂")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [pausedEmbed],
        })
        .catch(() => {});
    }
    player.unpause(interaction);
  },
};
