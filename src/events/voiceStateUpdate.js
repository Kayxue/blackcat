import { EmbedBuilder } from "discord.js";
import PlayerManager from "../audio/PlayerManager.js";
import { danger } from "../color.js";

export default {
  event: "voiceStateUpdate",
  once: false,
  run: async (client, oldState, newState) => {
    try {
      if (!oldState.channel) return; // User join new voice channel

      let player = PlayerManager.getSendingPlayer(
        client,
        oldState.guild.id ?? newState.guild.id,
      );
      if (!player) return; // Guild is not playing music

      setTimeout(() => {
        let voiceChannel = newState.guild.members.me.voice.channel;
        if (!voiceChannel) return; // Bot has been kicked out by user, let player do it's work

        let members = voiceChannel.members.filter(
          (member) => !member.user.bot,
        );
        if (members.size <= 0) {
          let leaveEmbed = new EmbedBuilder()
            .setTitle("👋 ┃ 語音頻道已經沒人了，所以我停止了音樂")
            .setColor(danger);
          player.textChannel
            .send({
              embeds: [leaveEmbed],
            })
            .catch(() => {});
          player.stop(null, true);
        }
      }, 15_000);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  },
};
