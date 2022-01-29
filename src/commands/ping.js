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
    .setName("ping")
    .setDescription("查看機器人訊息及語音延遲"),
  /**
   * 
   * @param {CommandInteraction} interaction 
   * @param {*} event 
   */
  run: function (interaction, event) {
    let pingEmbed = new MessageEmbed()
      .setTitle("🏓 Ping!")
      .addField("🔗 API", `**${Date.now() - interaction.createdTimestamp}** 毫秒`, true)
      .addField("🌐 WebSocket", `**${interaction.client.ws.ping}** 毫秒`, true)
      .setColor(colors.success)
      console.log()
    let player = getSendingPlayer(interaction.client, interaction.guild.id);
    if (player) {
      pingEmbed.addField("🎶 音樂 - UDP", `**${player.ping.udp ?? "未知"}** 毫秒`)
      pingEmbed.addField("🎶 音樂 - WebSocket", `**${player.ping.ws ?? "未知"}** 毫秒`)
    }
    interaction.reply({
      embeds: [pingEmbed]
    }).catch((e) => {});
  }
}