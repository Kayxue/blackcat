const {
  MessageEmbed
} = require("discord.js");
const {
  getSendingPlayer
} = require("../audio/PlayerManager.js");
const {
  SlashCommandBuilder
} = require("@discordjs/builders");
const colors = require("../color.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("status")
    .setDescription("查看機器人的狀態"),
  run: function (interaction) {
    let seconds = Math.floor(interaction.client.uptime / 1000);
    let minutes = Math.floor(seconds / 60);
    let hours = Math.floor(minutes / 60);
    let days = Math.floor(hours / 24);
    
    seconds %= 60;
    minutes %= 60;
    hours %= 24;
    
    let statusEmbed = new MessageEmbed()
      .setTitle("❓ 機器人狀態")
      .addField("🕒 上線時間", `**${days}:${hours}:${minutes}:${seconds}**`, true)
      .addField("📒 程式版本", `Node.js:**${process.version}** Discord.js:**${require("discord.js/package.json").version} play-dl:${require("play-dl/package.json").version}`, true)
      .addField("👥 伺服器數量", `**${interaction.client.guilds.cache.size}** 個伺服器`, true)
      .setColor(colors.success);
    interaction.reply({
      embeds: [statusEmbed]
    }).catch(() => {});
  }
};
