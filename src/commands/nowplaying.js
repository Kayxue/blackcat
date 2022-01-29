const PlayerManager = require("../audio/PlayerManager.js");
const progress = require("../util/progress.js");
const allowModify = require("../util/allowModify.js");
const {
  SlashCommandBuilder
} = require("@discordjs/builders");
const {
  MessageEmbed
} = require("discord.js");
const {
  success
} = require("../color.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nowplaying")
    .setDescription("暫停歌曲"),
  run: function(interaction) {
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id);
      if (!allowModify(interaction)) return interaction.reply("❌ 你必須跟我在同一個語音頻道")
        .catch(() => {});
    }
    let data = player.nowplaying;
    let progressbar = progress(data.duraction, player.playTime);
    let playtime = new Date(player.playTime * 1000).toISOString();
    
    if (player.playTime <= 0) playtime = "直播";
    else if (player.playTime < 3600) playtime = playtime.substr(14, 5);
    else playtime = playtime.substr(11, 8);
    
    let nowEmbed = new MessageEmbed()
      .setTitle("🎧 正在播放")
      .setDescription(
        `[${data.title}](${data.url})\n`+
        `${progressbar[0]} \`${playtime}/${Math.round(progressbar[1])}%\``)
      .setThumbnail(data.thumbnail)
      .setColor(success);
    return interaction.reply({
      embeds: [nowEmbed]
    })
      .catch(() => {});
  }
};