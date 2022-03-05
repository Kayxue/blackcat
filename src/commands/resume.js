import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";

export default {
  data: {
    name: "resume",
    description: "繼續播放音樂"
  },
  run: function (interaction) {
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道");
    }
    if (!player.paused) {
      let pausedEmbed = new MessageEmbed()
        .setTitle("▶️ 音樂已經在播放了")
        .setDescription("輸入`/pause`來暫停音樂")
        .setColor(danger);
      return interaction.reply({
        embeds: [pausedEmbed]
      }).catch(() => {});
    }
    player.unpause(interaction);
  },
};
