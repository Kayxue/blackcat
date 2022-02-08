const Player = require("../audio/PlayerManager.js");
const allowModify = require("../util/allowModify.js");
const {
  SlashCommandBuilder
} = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("resume")
    .setDescription("重新開始歌曲"),
  run: function (interaction) {
    let player;
    console.log(interaction);
    if (!Player.getSendingPlayer(interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = Player.getSendingPlayer(interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道");
    }
    player.unpause(interaction);
  },
};
