import requirePlayer from "../util/requirePlayer.js";

export default {
  data: {
    name: "shuffle",
    description: "打亂歌曲",
  },
  run: function (interaction) {
    requirePlayer(interaction, (player) => {
      player.shuffle(interaction);
    });
  },
};
