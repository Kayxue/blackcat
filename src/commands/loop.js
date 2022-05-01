import requirePlayer from "../util/requirePlayer.js";

export default {
  data: {
    name: "loop",
    description: "重複播放歌曲序列",
  },
  run: function(interaction) {
    requirePlayer(interaction, (player) => {
      player.loop(interaction);
    });
  },
};