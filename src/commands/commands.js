import { EmbedBuilder } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "commands",
    description: "顯示所有指令",
  },
  run: function (interaction) {
    const commands = interaction.client.commands;

    const formatted = commands.map(
      (i) => `\`${i.data.name}\`: **${i.data.description}**`,
    );
    const commandsEmbed = new EmbedBuilder()
      .setTitle("🗒️ ┃ 指令清單")
      .setDescription(formatted.join("\n"))
      .setColor(blurple);

    interaction
      .reply({
        embeds: [commandsEmbed],
      })
      .catch(() => {});
  },
};
