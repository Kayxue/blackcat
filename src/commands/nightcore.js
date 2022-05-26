import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";
import { MessageEmbed } from "discord.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "nightcore",
    description: "啟動Nightcore音效",
    options: [
      {
        type: 3, //STRING
        name: "name",
        description:
          "YouTube上的音樂名稱/網址，使用這個值來直接播放Nightcore音樂",
        required: false,
      },
    ],
  },
  run: async function (interaction) {
    if (interaction.client.config.optimizeQuality) {
      let optimizeEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 為了優化音樂品質，Nightcore已停用")
        .setDescription(
          "如果你還是想要啟用Nightcore音效，請嘗試[自己建立一個黑貓](https://github.com/blackcatbot/blackcat)",
        )
        .setColor(danger);
      return interaction
        .reply({
          embeds: [optimizeEmbed],
        })
        .catch(() => {});
    }

    if (!interaction.member.voice?.channel) {
      let joinVCEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 你必須先在語音頻道內")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [joinVCEmbed],
        })
        .catch(() => {});
    }

    let url = interaction.options.getString("name");
    if (!interaction.member.voice.channel.joinable)
      return interaction
        .reply("❌ ┃ 我無法連線至語音頻道!")
        .catch(() => {});

    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      player = PlayerManager.createSendingPlayer(interaction);
      await player.init();
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    if (player.songs.length !== 0) player.nightcore(interaction);
    else if (player.songs.length === 0 && url) {
      await interaction.deferReply().catch(() => {});
      player.play(url, interaction, false, true);
    } else if (!url && player.songs.lenght === 0) {
      let noURLEmbed = new MessageEmbed()
        .setColor(danger)
        .setTitle("❌ ┃ 請輸入網址來使用Nightcore模式播放音樂");
      interaction
        .reply({
          embeds: [noURLEmbed],
        })
        .catch(() => {});
    }
  },
};
