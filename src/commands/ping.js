const { MessageEmbed } = require("discord.js");
const { getSendingPlayer } = require("../audio/player.js");
const colors = require("../color.json");

module.exports = {
  name: "ping",
  run: function(event) {
    let pingEmbed = new MessageEmbed()
      .setTitle("🏓 Ping!")
      .addField("🔗 API", `**${Date.now() - event.createdTimestamp}** 毫秒`, true)
      .addField("🌐 WebSocket", `**${event.client.ws.ping}** 毫秒`, true)
      .setColor(colors.success)
    let player = getSendingPlayer(event.guild);
    if (player) {
      pingEmbed.addField("🎶 音樂 - UDP", `**${player.ping.udp ?? "未知"}** 毫秒`)
      pingEmbed.addField("🎶 音樂 - WebSocket", `**${player.ping.ws ?? "未知"}** 毫秒`)
    }
    event.channel.send({
      embeds: [pingEmbed]
    }).catch(e => {});
  }
}