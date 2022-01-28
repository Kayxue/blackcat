const Player = require("../audio/player.js");

module.exports = {
  name: "resume",
  run: function(event) {
    let player;
    if (!Player.getSendingPlayer(event.guild)) {
      return event.channel.send("❌ 必須要有音樂正在播放");
    } else {
      player = Player.getSendingPlayer(event.guild);
      if (!event.allowModify) return event.channel.send("❌ 你必須加入一個語音頻道");
    }
    player.unpause();
  }
};