import PlayerManager from "../audio/PlayerManager.js";
import progress from "../util/progress.js";
import allowModify from "../util/allowModify.js";
import { MessageEmbed } from "discord.js";
import { blurple } from "../color.js";

export default {
  data: {
    name: "nowplaying",
    description: "查看目前正在播放的音樂"
  },
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
      .setColor(blurple);
    return interaction.reply({
      embeds: [nowEmbed]
    })
      .catch(() => {});
  }
};
