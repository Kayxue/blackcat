const {
  SlashCommandBuilder
} = require("@discordjs/builders");
const PlayerManager = require("../audio/PlayerManager.js");
const allowModify = require("../util/allowModify.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("播放音樂")
    .addStringOption((option) =>
      option
        .setName("songname")
        .setDescription("YouTube歌曲名稱或連結")
        .setRequired(true)
    ),
  run: async function(interaction) {
    if (!interaction.member.voice?.channel)
      return interaction.reply("❌ 你必須加入一個語音頻道")
        .catch(() => {});
    
    const permissionBot = interaction.member.voice?.channel.permissionsFor(interaction.guild.me);
    if (!permissionBot.has("CONNECT") || !permissionBot.has("SPEAK"))
      return interaction.reply("❌ 我無法連線至語音頻道!")
        .catch(() => {});
    
    const url = interaction.options.getString("songname");
    let player;
    if (!PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id)) {
      player = PlayerManager.createSendingPlayer(interaction);
      player.init();
    } else {
      player = PlayerManager.getSendingPlayer(interaction.client, interaction.guild.id);
      if (!allowModify(interaction))
        return interaction.reply("❌ 你必須加入一個語音頻道")
          .catch(() => {});
    }
    await interaction.deferReply()
      .catch(() => {});
    player.play(url, interaction);
  },
};