import requirePlayer from "../util/requirePlayer.js";

export default {
  data: {
    name: "skip",
    description: "跳過歌曲",
  },
  run: function (interaction) {
    requirePlayer(interaction, (player) => {
      player.skip(interaction);
    });
  },
};
