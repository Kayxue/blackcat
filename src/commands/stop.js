import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";

export default {
  data: {
    name: "stop",
    description: "停止播放歌曲並清除序列",
  },
  run: function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    player.stop(interaction);
  },
};
