import requirePlayer from "../util/requirePlayer.js";

export default {
  data: {
    name: "repeat",
    description: "重複播放目前正在播放的歌曲",
  },
  run: function (interaction) {
    requirePlayer(interaction, (player) => {
      player.repeat(interaction);
    });
  },
};
