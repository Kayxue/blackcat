const PlayerManager = require("../audio/PlayerManager.js");
const allowModify = require("../util/allowModify.js");
const {
  SlashCommandBuilder
} = require("@discordjs/builders");

module.exports = {
  data: new SlashCommandBuilder().setName("skip").setDescription("跳過歌曲"),
  run: function (interaction) {
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.guild.id)) {
      return interaction.reply("❌ 必須要有音樂正在播放");
    } else {
      player = PlayerManager.getSendingPlayer(interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道");
    }
    player.skip(interaction);
  },
};
