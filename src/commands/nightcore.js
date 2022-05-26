import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "nightcore",
    description: "啟動nightcore音效",
  },
  run: async function (interaction) {
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

    if (!interaction.member.voice?.channel) {
      let joinVCEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 你必須先在語音頻道內")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [joinVCEmbed],
        })
        .catch(() => {});
    }

    if (!interaction.member.voice.channel.joinable)
      return interaction
        .reply("❌ ┃ 我無法連線至語音頻道!")
        .catch(() => {});

    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      player = PlayerManager.createSendingPlayer(interaction);
      await player.init();
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction))
        return interaction
          .reply("❌ ┃ 你必須跟我在同一個頻道")
          .catch(() => {});
    }
    // else {
    //   if (!allowModify(interaction)) return joinVC(interaction);
    // }
    player.nightcore(interaction);
  },
};
