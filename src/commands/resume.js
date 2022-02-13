import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";

export default {
  data: {
    name: "resume",
    description: "繼續播放音樂"
  },
  run: function (interaction) {
    let player;
    console.log(interaction);
    if (!PlayerManager.getSendingPlayer(interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道");
    }
    player.unpause(interaction);
  },
};
