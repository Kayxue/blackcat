import {
  MessageEmbed,
  ApplicationCommandOptionType,
} from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";
import { blurple, success, danger } from "../color.js";

export default {
  data: {
    name: "volume",
    description: "調整音樂音量",
    options: [
      {
        name: "volume",
        description: "音量大小，留空會顯示目前的音量",
        type: ApplicationCommandOptionType.Integer,
        required: false,
      },
    ],
  },
  run: function (interaction) {
    if (interaction.client.config.optimizeQuality) {
      let optimizeEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 為了優化音樂品質，音量已停用")
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
      return interaction.reply("❌ ┃ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    if (
      typeof interaction.options.getInteger("volume") !== "undefined"
    ) {
      if (interaction.options.getInteger("volume") > 200) {
        return interaction.reply("❌ ┃ 音量不能大於 200");
      } else if (interaction.options.getInteger("volume") < 0) {
        return interaction.reply("❌ ┃ 音量不能小於 0");
      }

      player.volume = interaction.options.getInteger("volume") / 100;
      let volumeEmbed = new MessageEmbed()
        .setTitle(`🔊 設定音量至 ┃ ${player.volume * 100}%`)
        .setColor(success);
      return interaction.reply({
        embeds: [volumeEmbed],
      });
    } else {
      let volumeEmbed = new MessageEmbed()
        .setTitle(`🔊 目前音量 ┃ ${player.volume * 100}%`)
        .setColor(blurple);
      return interaction.reply({
        embeds: [volumeEmbed],
      });
    }
  },
};
