import requirePlayer from "../util/requirePlayer.js";

export default {
  data: {
    name: "stop",
    description: "停止播放歌曲並清除序列",
  },
  run: function (interaction) {
    requirePlayer(interaction, (player) => {
      player.stop(interaction);
    });
  },
};
