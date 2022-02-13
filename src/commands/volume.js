import { MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { danger } from "../color.js";

export default {
  data: {
    name: "volume",
    description: "調整音樂音量"
  },
  run: function (interaction) {
    let volumeEmbed = new MessageEmbed()
      .setTitle("🙁 音量調整已被移除") 
      .setDescription(
        "為了提供更好的音質，音量調整已被移除\n"+
        "如果您仍要調整音量，請在我的頭貼上點選右鍵來調整音量")
      .setColor(danger);
    interaction.reply({
      embeds: [volumeEmbed]
    }).catch(() => {});
  }
};
