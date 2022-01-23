const Player = require("../audio/player.js")

module.exports = {
  name: "play",
  run(event, args) {
    let url = args[0];
    let player = new Player(event, event.guild, event.member.voice.channel);
    player.init();
    player.play(url);
  }
}