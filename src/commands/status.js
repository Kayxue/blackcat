import prettyBytes from "pretty-bytes";
import { MessageEmbed, version } from "discord.js";
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

    let guilds = await interaction.client.shard.fetchClientValues(
      "guilds.cache.size",
    );
    let players = await interaction.client.shard.fetchClientValues(
      "players.size",
    );

    let allGuilds = guilds.reduce(
      (acc, guildCount) => acc + guildCount,
      0,
    );
    let allPlayers = players.reduce(
      (acc, playerCount) => acc + playerCount,
      0,
    );

    let statusEmbed = new MessageEmbed()
      .setTitle("❓ ┃ 機器人狀態")
      .addField(
        "🕒 ┃ 上線時間",
        `**${days}天${hours}時${minutes}分**`,
        true,
      )
      .addField(
        "📒 ┃ 程式版本",
        `Node.js:**${process.version.replace(
          "v",
          "",
        )}** Discord.js:**${version}**`,
        true,
      )
      .addField("\u200b", "\u200b")
      .addField(
        "❄ ┃ 分片",
        `**${interaction.guild.shardId + 1}/${
          interaction.client.shard.count
        }**`,
        true,
      )
      .addField(
        "👥 ┃ 分片伺服器數量",
        `**${interaction.client.guilds.cache.size}** 個伺服器`,
        true,
      )
      .addField(
        "🔊 ┃ 分片音樂播放器數量",
        `**${interaction.client.players.size}** 個播放器`,
        true,
      )
      .addField("\u200b", "\u200b")
      .addField(
        "👥 ┃ 所有伺服器數量",
        `**${allGuilds}** 個伺服器`,
        true,
      )
      .addField(
        "🔊 ┃ 所有音樂播放器數量",
        `**${allPlayers}** 個播放器`,
        true,
      )
      .addField("\u200b", "\u200b")
      .addField(
        "📁 ┃ 此分片記憶體使用率",
        `Node.js Runtime: **${prettyBytes(memUsage.rss)}**` +
          "\n" +
          `V8: **${prettyBytes(memUsage.heapUsed)}/${prettyBytes(
            memUsage.heapTotal,
          )}**` +
          "\n" +
          `V8 外部程式碼: **${prettyBytes(memUsage.external)}**` +
          "\n" +
          `已定位陣列: **${prettyBytes(memUsage.arrayBuffers)}**`,
      )
      .setColor(blurple);
    interaction
      .reply({
        embeds: [statusEmbed],
      })
      .catch(() => {});
  },
};
