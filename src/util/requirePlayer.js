import { EmbedBuilder } from "discord.js";
import { warning } from "../color.js";
import PlayerManager from "../audio/PlayerManager.js";
import allowModify from "../util/allowModify.js";
import joinVC from "../util/joinVC.js";

export default async function requirePlayer(interaction, callback) {
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
    if (!interaction.guild.members.me.voice.channel && player) {
      let corruptedEmbed = new EmbedBuilder()
        .setTitle("😔 播放器已損毀，我們正在嘗試建立一個新的")
        .setColor(warning);
      try {
        await interaction.channel.send({
          embeds: [corruptedEmbed],
        });
        player.stop(null, true);
      } catch (e) {}
    } else if (!allowModify(interaction)) return joinVC(interaction);
  }

  callback(player);
}
