const { MessageEmbed } = require("discord.js");
const Player = require("../audio/player.js");
const progress = require("../util/progress.js");
const { success } = require("../color.json");

module.exports = {
  name: "nowplaying",
  run: function(event) {
    let player;
    if (!Player.getSendingPlayer(event.guild)) {
      return event.channel.send("❌ 必須要有音樂正在播放");
    } else {
      player = Player.getSendingPlayer(event.guild);
      if (!event.allowModify) return event.channel.send("❌ 你必須加入一個語音頻道");
    }
    let data = player.nowplaying;
    let progressbar = progress(data.duraction, player.playTime);
    let playtime = new Date(player.playTime * 1000).toISOString();
    
    if (player.playTime <= 0) playtime = "直播"
    else if (player.playTime < 3600) playtime = playtime.substr(14, 5);
    else playtime = playtime.substr(11, 8);
    
    let nowEmbed = new MessageEmbed()
      .setTitle("🎧 正在播放")
      .setDescription(
        `[${data.title}](${data.url})\n`+
        `${progressbar[0]} \`${playtime}/${Math.round(progressbar[1])}%\``)
      .setThumbnail(data.thumbnail)
      .setColor(success);
    return event.channel.send({
      embeds: [nowEmbed]
    });
  }
}