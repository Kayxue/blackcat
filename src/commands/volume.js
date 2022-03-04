import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "volume",
    description: "調整音樂音量",
    options: [
      {
        name: "volume",
        description: "音量大小",
        type: 4,
        required: true
      }
    ]
  },
  run: function (interaction) {
    const embed = new MessageEmbed()
      .setColor(danger)
      .setTitle("音量調整")
      .setDescription(`音量調整為 ${interaction.options.volume}`);
    interaction.message.channel.send(embed);
  }
};
