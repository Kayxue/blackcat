import { MessageEmbed } from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";
import { danger } from "../color.js";

export default {
  data: {
    name: "playnext",
    description: "把指定歌曲加到序列的最前面",
    options: [
      {
        name: "song",
        description: "歌曲編號",
        type: 4, // integer
        required: true,
      },
    ],
  },
  run: function (interaction) {
    let player;
    if (
      !PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      )
    ) {
      return interaction
        .reply("❌ ┃ 必須要有音樂正在播放")
        .catch(() => {});
    } else {
      player = PlayerManager.getSendingPlayer(
        interaction.client,
        interaction.guild.id,
      );
      if (!allowModify(interaction)) return joinVC(interaction);
    }
    let number = interaction.options.getInteger("song");
    if (number <= 0) {
      let invaildEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 歌曲編號不能小於或等於0!")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [invaildEmbed],
        })
        .catch(() => {});
    } else if (number <= 2) {
      let invaildEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 歌曲編號不能是1或是2!")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [invaildEmbed],
        })
        .catch(() => {});
    } else if (number > player.songs.length) {
      let invaildEmbed = new MessageEmbed()
        .setTitle("❌ ┃ 歌曲編號不能大約序列長度")
        .setColor(danger);
      return interaction
        .reply({
          embeds: [invaildEmbed],
        })
        .catch(() => {});
    }

    player.playnext(interaction, number);
  },
};
