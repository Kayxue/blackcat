import { MessageEmbed } from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "play",
    description: "播放音樂",
    options: [
      {
        type: 3, //STRING
        name: "name",
        description: "YouTube上的音樂名稱/網址",
        required: true,
      },
    ],
  },
  run: async function (interaction) {
    if (!interaction.member.voice?.channel) {
      let joinVCEmbed = new MessageEmbed()
        .setTitle("❌ 你必須先在語音頻道內")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [joinVCEmbed],
        })
        .catch(() => {});
    }

    if (!interaction.member.voice.channel.joinable)
      return interaction
        .reply("❌ 我無法連線至語音頻道!")
        .catch(() => {});

    const url = interaction.options.getString("name");
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      player = PlayerManager.createSendingPlayer(interaction);
      player.init();
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction))
        return interaction
          .reply("❌ 你必須跟我在同一個頻道")
          .catch(() => {});
    }
    await interaction.deferReply().catch(() => {});
    player.play(url, interaction);
  },
};
