import { MessageEmbed } from "discord.js";
import { SlashCommandBuilder } from "@discordjs/builders";
import { getSendingPlayer } from "../audio/PlayerManager.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "ping",
    description: "查看機器人"
  },
  run: function (interaction) {
    let pingEmbed = new MessageEmbed()
      .setTitle("🏓 Ping!")
      .addField("🔗 API", `**${Date.now() - interaction.createdTimestamp}** 毫秒`, true)
      .addField("🌐 WebSocket", `**${interaction.client.ws.ping}** 毫秒`, true)
      .setColor(blurple);
    let player = getSendingPlayer(interaction.client, interaction.guild.id);
    if (player) {
      pingEmbed.addField("🎶 音樂 - UDP", `**${player.ping.udp ?? "未知"}** 毫秒`);
      pingEmbed.addField("🎶 音樂 - WebSocket", `**${player.ping.ws ?? "未知"}** 毫秒`);
    }
    interaction.reply({
      embeds: [pingEmbed]
    }).catch(() => {});
  }
};
