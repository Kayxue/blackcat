import { MessageEmbed } from "discord.js";
import log from "../logger.js";
import PlayerManager from "../audio/PlayerManager.js";
import { danger } from "../color.js";

export default {
  event: "voiceStateUpdate",
  once: false,
  run: async (client, oldState, newState) => {
    try {
      if (!oldState.channel) return; // User join new voice channel
      
      let player = PlayerManager.getSendingPlayer(client, oldState.guild.id ?? newState.guild.id);
      if (!player) return; // Guild is not playing music
      
      setTimeout(() => {
        let voiceChannel = newState.guild.me.voice.channel;
        if (!VoiceChannel) return; // Bot has been kicked out by user, let player do it's work
        
        let members = voiceChannel.members.filter(member => !member.user.bot);
        if (members <= 0) {
          let leaveEmbed = new MessageEmbed()
            .setTitle("👋 語音頻道已經沒人了，所以我停止了音樂")
            .setColor(danger);
          player.textChannel.send({
            embeds: [leaveEmbed]
          }).catch(() => {});
          player.stop(null, true);
        }
      })
    } catch (e) {}
  },
};
