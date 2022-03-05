import { MessageEmbed } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "commands",
    description: "顯示所有指令",
  },
  run: function (interaction) {
    let commands = interaction.client.commands
    
    let formatted = commands.map((i) => `\`${i.name}\`: **${i.description}**`);
    let commandsEmbed = new MessageEmbed()
      .setTitle("🗒️ 指令清單")
      .setDescription(formatted.join("\n"))
      .setColor(blurple)
    
    interaction.reply({
      embeds: [commandsEmbed]
    }).catch(() => {});
  }
}
