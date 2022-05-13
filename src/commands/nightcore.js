import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";
import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "nightcore",
    description: "啟動nightcore音效",
  },
  run: function (interaction) {
    if (interaction.client.config.optimizeQuality) {
      let optimizeEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 為了優化音樂品質，Nightcore已停用")
        .setDescription(
          "如果你還是想要修改音量，請嘗試[自己建立一個黑貓](https://github.com/blackcatbot/blackcat)",
        )
        .setColor(danger);
      return interaction
        .reply({
          embeds: [optimizeEmbed],
        })
        .catch(() => {});
    }

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
    player.nightcore(interaction);
  },
};
