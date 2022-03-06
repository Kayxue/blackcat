import { MessageEmbed, version } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "status",
    description: "查看機器人的狀態"
  },
  run: async function (interaction) {
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
      .addField("📒 程式版本", `Node.js:**${process.version.replace("v", "")}** Discord.js:**${version}`, true)
      .addField("👥 分片伺服器數量", `**${interaction.client.guilds.cache.size}** 個伺服器`, true)
      .setColor(blurple);
    interaction.reply({
      embeds: [statusEmbed]
    }).catch(() => {});
  }
};
