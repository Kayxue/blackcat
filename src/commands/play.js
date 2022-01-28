const Player = require("../audio/player.js")

module.exports = {
  name: "play",
  run: function(event, args) {
    if (!event.member.voice.channel) return event.channel.send("❓ 你必須加入一個語音頻道");
    
    let player;
    if (!Player.getSendingPlayer(event.guild)) {
      player = new Player(event, event.guild, event.member.voice.channel);
      player.init();
    } else {
      player = Player.getSendingPlayer(event.guild);
      if (!event.allowModify) return event.channel.send("❌ 你必須加入一個語音頻道");
    }
    player.play(args.join(" "));
  }
}