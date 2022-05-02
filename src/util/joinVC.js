import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default function joinVC(interaction) {
  let vcEmbed = new MessageEmbed()
    .setTitle("❌ ┃ 你必須跟我在同一個頻道裡!")
    .setDescription(
      `你必須在 <#${interaction.guild.me.voice.channel?.id}> 才可以使用 **/${interaction.commandName}**`,
    )
    .setColor(danger);
  return interaction
    .reply({
      embeds: [vcEmbed],
    })
    .catch(() => {});
}
