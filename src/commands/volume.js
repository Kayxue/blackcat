import { MessageEmbed } from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import {
  danger,
  success
} from "../color.js";

export default {
  data: {
    name: "volume",
    description: "調整音樂音量",
    options: [
      {
        name: "volume",
        description: "音量大小，留空會顯示目前的音量",
        type: 4,
        required: false
      }
    ]
  },
  run: function (interaction) {
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道");
    }
    if (interaction.options.getInteger("volume")) {
      if (interaction.options.getInteger("volume") > 200) {
        return interaction.reply("❌ 音量不能大於 200");
      } else if (interaction.options.getInteger("volume") < 0) {
        return interaction.reply("❌ 音量不能小於 0");
      }

      player.volume = interaction.options.getInteger("volume") / 100;
      interaction.reply("🔊 音量設定為：" + player.volume * 100 + "%");
    } else {
      interaction.reply("🔊 目前音量：" + player.volume * 100 + "%");
    }
  }
};
