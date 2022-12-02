import { EmbedBuilder } from "discord.js";
import { getSendingPlayer } from "../audio/PlayerManager.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "ping",
    description: "查看機器人",
  },
  run: function (interaction) {
    const pingEmbed = new EmbedBuilder()
      .setTitle("🏓 ┃ Ping!")
      .addFields([
        {
          name: "🔗 ┃ API",
          value: `**${
            Date.now() - interaction.createdTimestamp
          }** 毫秒`,
          inline: true,
        },
        {
          name: "🌐 ┃ WebSocket",
          value: `**${interaction.client.ws.ping}** 毫秒`,
          inline: true,
        },
      ])
      .setColor(blurple);
    const player = getSendingPlayer(
      interaction.client,
      interaction.guild.id,
    );
    if (player) {
      pingEmbed.addFields([
        {
          name: "🎶 ┃ 音樂 - UDP",
          value: `**${player.ping.udp ?? "未知"}** 毫秒`,
        },
        {
          name: "🎶 ┃ 音樂 - WebSocket",
          value: `**${player.ping.ws ?? "未知"}** 毫秒`,
        },
      ]);
    }
    interaction
      .reply({
        embeds: [pingEmbed],
      })
      .catch(() => {});
  },
};
