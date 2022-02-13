import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import { SlashCommandBuilder } from "@discordjs/builders";

export default {
  data: {
    name: "play",
    description: "播放音樂",
    options: [
      {
        type: 3, //STRING
        name: "name",
        description: "YouTube上的音樂名稱/網址",
        required: true
      }
    ]
  },
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
