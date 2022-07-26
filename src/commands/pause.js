import { EmbedBuilder } from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "pause",
    description: "暫停目前正在播放的音樂",
  },
  run: function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction
        .reply("❌ ┃ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    if (player.paused) {
      let pausedEmbed = new EmbedBuilder()
        .setTitle("⏸️ ┃ 音樂已經暫停了")
        .setDescription("輸入`/resume`來繼續播放音樂")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [pausedEmbed],
        })
        .catch(() => {});
    } else {
      player.pause(interaction);
    }
  },
};
