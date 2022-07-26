import prettyBytes from "pretty-bytes";
import { EmbedBuilder, version } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "status",
    description: "查看機器人的狀態",
  },
  run: async function (interaction) {
    let seconds = Math.floor(interaction.client.uptime / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);

    let memUsage = process.memoryUsage();

    minutes %= 60;
    hours %= 24;

    let guilds = await interaction.client.cluster.broadcastEval(
      "this.guilds.cache.size",
    );
    let players = await interaction.client.cluster.broadcastEval(
      "this.players.size",
    );

    let allGuilds = guilds.reduce(
      (acc, guildCount) => acc + guildCount,
      0,
    );
    let allPlayers = players.reduce(
      (acc, playerCount) => acc + playerCount,
      0,
    );

    let statusEmbed = new EmbedBuilder()
      .setTitle("❓ ┃ 機器人狀態")
      .addFields([
        {
          name: "🕒 ┃ 上線時間",
          value: `**${days}天${hours}時${minutes}分**`,
          inline: true,
        },
        {
          name: "📒 ┃ 程式版本",
          value: `Node.js:**${process.version.replace(
            "v",
            "",
          )}** Discord.js:**${version}**`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
        },
        {
          name: "❄ ┃ 分片",
          value: `**${interaction.guild.shardId + 1}/${
            interaction.client.cluster.info.TOTAL_SHARDS
          }**`,
          inline: true,
        },
        {
          name: "👥 ┃ 分片伺服器數量",
          value: `**${interaction.client.guilds.cache.size}** 個伺服器`,
          inline: true,
        },
        {
          name: "🔊 ┃ 分片音樂播放器數量",
          value: `**${interaction.client.players.size}** 個播放器`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
        },
        {
          name: "👥 ┃ 所有伺服器數量",
          value: `**${allGuilds}** 個伺服器`,
          inline: true,
        },
        {
          name: "🔊 ┃ 所有音樂播放器數量",
          value: `**${allPlayers}** 個播放器`,
          inline: true,
        },
        {
          name: "\u200b",
          value: "\u200b",
        },
        {
          name: "📁 ┃ 此分片記憶體使用率",
          value:
            `Node.js Runtime: **${prettyBytes(memUsage.rss)}**` +
            "\n" +
            `V8: **${prettyBytes(memUsage.heapUsed)}/${prettyBytes(
              memUsage.heapTotal,
            )}**` +
            "\n" +
            `V8 外部程式碼: **${prettyBytes(memUsage.external)}**` +
            "\n" +
            `已定位陣列: **${prettyBytes(memUsage.arrayBuffers)}**`,
        },
      ])
      .setColor(blurple);
    interaction
      .reply({
        embeds: [statusEmbed],
      })
      .catch(() => {});
  },
};
